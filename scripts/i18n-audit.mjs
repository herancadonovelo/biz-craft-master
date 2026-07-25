#!/usr/bin/env node
/**
 * i18n audit — scans src/routes/** for Portuguese literal strings in JSX/TSX
 * that are not wrapped in the translation helper (t("..."), useT, <Trans>, etc.)
 * and produces a Markdown + JSON report at reports/i18n-audit.{md,json}.
 *
 * Usage:  node scripts/i18n-audit.mjs [--dir src/routes] [--json] [--quiet]
 *
 * Heuristics:
 *  - Flags JSX text nodes and JSX string attribute values (title, placeholder,
 *    aria-label, alt, label) containing PT-specific characters (á à â ã é ê í
 *    ó ô õ ú ç) OR common PT stopwords ("não", "sim", "olá", "obrigado",
 *    "adicionar", "guardar", "eliminar", "editar", "cancelar", ...).
 *  - Ignores strings inside t(), i18n.t(), tr(), useT()(), <Trans>, imports,
 *    URLs, className, style, data-* attributes, and pure identifiers.
 *  - Ignores comments and template expressions.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const ROOT = process.cwd();
const TARGET_DIR = path.resolve(ROOT, getArg("--dir", "src/routes"));
const EMIT_JSON = args.includes("--json");
const QUIET = args.includes("--quiet");

const PT_DIACRITICS = /[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/;
const PT_STOPWORDS = [
  "não", "sim", "olá", "obrigado", "obrigada", "voltar", "seguinte",
  "adicionar", "guardar", "gravar", "eliminar", "apagar", "remover",
  "editar", "cancelar", "confirmar", "criar", "novo", "nova",
  "utilizador", "utilizadores", "palavra-passe", "definições", "configurações",
  "início", "início de sessão", "terminar sessão", "conta",
  "carregar", "a carregar", "aguarde", "erro", "sucesso", "atenção",
  "pesquisar", "procurar", "filtro", "filtrar", "ordenar",
  "tarefas", "projetos", "encomendas", "clientes", "fornecedores",
  "português", "inglês", "idioma", "tema", "aparência",
];
const PT_STOPWORD_RE = new RegExp(
  "\\b(" + PT_STOPWORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
  "i",
);

const IGNORE_ATTRS = new Set([
  "className", "class", "style", "id", "key", "ref", "type", "name",
  "href", "src", "to", "value", "defaultValue", "onClick", "onChange",
  "onSubmit", "role", "target", "rel", "loading", "sizes",
]);

const looksLikeCode = (s) =>
  /^[a-z0-9_\-./#?=&:%+]+$/i.test(s) || // urls, css classes, ids
  /^\s*$/.test(s) ||
  s.length < 3;

const isPortuguese = (s) => PT_DIACRITICS.test(s) || PT_STOPWORD_RE.test(s);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (/\.(tsx|jsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

function stripCommentsAndStrings(src) {
  // Remove block/line comments so we don't inspect them.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
}

function isWrappedByT(src, index) {
  // Look back ~40 chars for t( / tr( / i18n.t( / useT()(
  const back = src.slice(Math.max(0, index - 60), index);
  return /\b(t|tr|i18n\.t|__)\s*\(\s*$/.test(back) ||
         /\bTrans\b[^>]*>\s*$/.test(back);
}

function scanFile(file, src) {
  const findings = [];
  const clean = stripCommentsAndStrings(src);

  // 1. JSX text nodes: >TEXT<
  const jsxText = />([^<>{}\n]{3,}?)</g;
  let m;
  while ((m = jsxText.exec(clean))) {
    const text = m[1].trim();
    if (!text || looksLikeCode(text)) continue;
    if (!isPortuguese(text)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: "jsx-text", line, text });
  }

  // 2. JSX string attributes: attr="text" or attr={"text"}
  const attrRe = /\b([a-zA-Z_][\w-]*)\s*=\s*(?:\{?\s*)["']([^"'\n]{3,}?)["']/g;
  while ((m = attrRe.exec(clean))) {
    const [, attr, text] = m;
    if (IGNORE_ATTRS.has(attr)) continue;
    if (looksLikeCode(text)) continue;
    if (!isPortuguese(text)) continue;
    if (isWrappedByT(clean, m.index + m[0].indexOf(text) - 1)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: `attr:${attr}`, line, text });
  }

  // 3. Bare string literals inside JSX braces: {"texto"} or {'texto'}
  const braceRe = /\{\s*["']([^"'\n]{3,}?)["']\s*\}/g;
  while ((m = braceRe.exec(clean))) {
    const text = m[1];
    if (looksLikeCode(text)) continue;
    if (!isPortuguese(text)) continue;
    if (isWrappedByT(clean, m.index)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: "jsx-brace-string", line, text });
  }

  return findings;
}

async function main() {
  const files = await walk(TARGET_DIR);
  const report = [];
  for (const file of files) {
    const src = await fs.readFile(file, "utf8");
    const findings = scanFile(file, src);
    if (findings.length) {
      report.push({ file: path.relative(ROOT, file), findings });
    }
  }

  await fs.mkdir(path.resolve(ROOT, "reports"), { recursive: true });
  const jsonPath = path.resolve(ROOT, "reports/i18n-audit.json");
  const mdPath = path.resolve(ROOT, "reports/i18n-audit.md");

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const totalFindings = report.reduce((n, r) => n + r.findings.length, 0);
  const md = [
    `# i18n audit — literais PT fora de t()`,
    ``,
    `- Diretório: \`${path.relative(ROOT, TARGET_DIR)}\``,
    `- Ficheiros com ocorrências: **${report.length}**`,
    `- Total de ocorrências: **${totalFindings}**`,
    `- Gerado: ${new Date().toISOString()}`,
    ``,
    `> Heurística: strings com diacríticos PT ou stopwords comuns em JSX/atributos, não envolvidas em \`t(...)\`, \`i18n.t(...)\`, \`tr(...)\` ou \`<Trans>\`.`,
    ``,
  ];
  for (const r of report) {
    md.push(`## \`${r.file}\`  _(${r.findings.length})_`);
    md.push("");
    md.push("| Linha | Tipo | Texto |");
    md.push("|------:|------|-------|");
    for (const f of r.findings) {
      const safe = f.text.replace(/\|/g, "\\|").slice(0, 160);
      md.push(`| ${f.line} | \`${f.kind}\` | ${safe} |`);
    }
    md.push("");
  }
  await fs.writeFile(mdPath, md.join("\n"));

  if (!QUIET) {
    console.log(`i18n audit: ${totalFindings} ocorrência(s) em ${report.length} ficheiro(s).`);
    console.log(`  → ${path.relative(ROOT, mdPath)}`);
    console.log(`  → ${path.relative(ROOT, jsonPath)}`);
  }
  if (EMIT_JSON) console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});