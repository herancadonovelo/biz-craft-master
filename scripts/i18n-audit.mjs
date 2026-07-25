#!/usr/bin/env node
/**
 * i18n audit v2 — scans a directory (default `src/routes`) for literal
 * strings in JSX/TSX that are NOT wrapped in the translation helper
 * (`t("...")`, `i18n.t(...)`, `tr(...)`, `<Trans>`) and are written in a
 * language different from the configured target (`--lang`, default `en`).
 *
 * Reports:
 *  - reports/i18n-audit.md   (grouped by route/component, with file:line links)
 *  - reports/i18n-audit.json
 *  - reports/i18n-audit.messages.json (translation-key skeleton, when --suggest)
 *
 * Usage:
 *   node scripts/i18n-audit.mjs [--dir src/routes] [--lang en]
 *                               [--exclude "regex1,regex2"]
 *                               [--suggest] [--ci] [--json] [--quiet]
 *
 * Exit codes:
 *   0 — no findings
 *   1 — findings present (only when --ci is set)
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
const TARGET_LANG = String(getArg("--lang", "en")).toLowerCase();
const EXCLUDE_RAW = String(getArg("--exclude", "")).trim();
const EXCLUDE_RES = EXCLUDE_RAW
  ? EXCLUDE_RAW.split(",").map((p) => new RegExp(p.trim(), "i")).filter(Boolean)
  : [];
const SUGGEST = args.includes("--suggest");
const CI_MODE = args.includes("--ci");
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

const EN_STOPWORDS = [
  "the", "and", "or", "of", "to", "for", "with", "from", "your", "our",
  "please", "cancel", "save", "delete", "edit", "add", "create", "new",
  "loading", "success", "error", "warning", "search", "filter", "sort",
  "tasks", "projects", "orders", "clients", "suppliers",
  "settings", "language", "theme", "appearance", "sign in", "sign out",
];
const EN_STOPWORD_RE = new RegExp("\\b(" + EN_STOPWORDS.join("|") + ")\\b", "i");

function detectLanguage(s) {
  if (PT_DIACRITICS.test(s) || PT_STOPWORD_RE.test(s)) return "pt";
  if (EN_STOPWORD_RE.test(s)) return "en";
  return "unknown";
}

const IGNORE_ATTRS = new Set([
  "className", "class", "style", "id", "key", "ref", "type", "name",
  "href", "src", "to", "value", "defaultValue", "onClick", "onChange",
  "onSubmit", "role", "target", "rel", "loading", "sizes",
]);

const looksLikeCode = (s) =>
  /^[a-z0-9_\-./#?=&:%+]+$/i.test(s) ||
  /^\s*$/.test(s) ||
  s.length < 3;

function shouldReport(s) {
  if (EXCLUDE_RES.some((re) => re.test(s))) return false;
  const lang = detectLanguage(s);
  if (lang === "unknown") return false;
  return lang !== TARGET_LANG;
}

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
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => " ".repeat(m.length))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));
}

function isWrappedByT(src, index) {
  const back = src.slice(Math.max(0, index - 60), index);
  return /\b(t|tr|i18n\.t|__)\s*\(\s*$/.test(back) ||
         /\bTrans\b[^>]*>\s*$/.test(back);
}

function toKey(routeSlug, text) {
  const norm = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `${routeSlug}.${norm || "text"}`;
}

function routeSlugFromFile(rel) {
  return rel
    .replace(/^src\/(routes|components)\//, "")
    .replace(/\.(tsx|jsx)$/, "")
    .replace(/[\\/]+/g, ".")
    .replace(/[^a-z0-9._-]/gi, "_");
}

function scanFile(file, src) {
  const findings = [];
  const clean = stripCommentsAndStrings(src);
  let m;

  const jsxText = />([^<>{}\n]{3,}?)</g;
  while ((m = jsxText.exec(clean))) {
    const text = m[1].trim();
    if (!text || looksLikeCode(text)) continue;
    if (!shouldReport(text)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: "jsx-text", line, text, lang: detectLanguage(text) });
  }

  const attrRe = /\b([a-zA-Z_][\w-]*)\s*=\s*(?:\{?\s*)["']([^"'\n]{3,}?)["']/g;
  while ((m = attrRe.exec(clean))) {
    const [, attr, text] = m;
    if (IGNORE_ATTRS.has(attr)) continue;
    if (looksLikeCode(text)) continue;
    if (!shouldReport(text)) continue;
    if (isWrappedByT(clean, m.index + m[0].indexOf(text) - 1)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: `attr:${attr}`, line, text, lang: detectLanguage(text) });
  }

  const braceRe = /\{\s*["']([^"'\n]{3,}?)["']\s*\}/g;
  while ((m = braceRe.exec(clean))) {
    const text = m[1];
    if (looksLikeCode(text)) continue;
    if (!shouldReport(text)) continue;
    if (isWrappedByT(clean, m.index)) continue;
    const line = clean.slice(0, m.index).split("\n").length;
    findings.push({ kind: "jsx-brace-string", line, text, lang: detectLanguage(text) });
  }

  return findings;
}

async function main() {
  const files = await walk(TARGET_DIR);
  const report = [];
  for (const file of files) {
    const src = await fs.readFile(file, "utf8");
    const findings = scanFile(file, src);
    if (findings.length) report.push({ file: path.relative(ROOT, file), findings });
  }

  await fs.mkdir(path.resolve(ROOT, "reports"), { recursive: true });
  const jsonPath = path.resolve(ROOT, "reports/i18n-audit.json");
  const mdPath = path.resolve(ROOT, "reports/i18n-audit.md");
  const msgsPath = path.resolve(ROOT, "reports/i18n-audit.messages.json");

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const totalFindings = report.reduce((n, r) => n + r.findings.length, 0);

  const suggestions = {};
  if (SUGGEST) {
    for (const r of report) {
      const slug = routeSlugFromFile(r.file);
      for (const f of r.findings) {
        const key = toKey(slug, f.text);
        if (!(key in suggestions)) suggestions[key] = f.text;
        f.suggestedKey = key;
      }
    }
    await fs.writeFile(msgsPath, JSON.stringify(suggestions, null, 2));
  }

  const md = [
    `# i18n audit — literais fora do idioma-alvo (\`${TARGET_LANG}\`)`,
    ``,
    `- Diretório: \`${path.relative(ROOT, TARGET_DIR)}\``,
    `- Idioma-alvo: \`${TARGET_LANG}\``,
    EXCLUDE_RES.length
      ? `- Exclusões: ${EXCLUDE_RES.map((r) => `\`${r.source}\``).join(", ")}`
      : `- Exclusões: _nenhuma_`,
    SUGGEST ? `- Mensagens sugeridas: \`${path.relative(ROOT, msgsPath)}\`` : ``,
    `- Ficheiros com ocorrências: **${report.length}**`,
    `- Total de ocorrências: **${totalFindings}**`,
    `- Gerado: ${new Date().toISOString()}`,
    ``,
    `> Heurística: strings cujo idioma detetado difere de \`${TARGET_LANG}\` e não estão envolvidas em \`t(...)\`, \`i18n.t(...)\`, \`tr(...)\` ou \`<Trans>\`.`,
    ``,
  ];

  const sorted = [...report].sort((a, b) => b.findings.length - a.findings.length);
  for (const r of sorted) {
    md.push(`## \`${r.file}\` — **${r.findings.length}** ocorrência(s)`);
    md.push("");
    md.push(SUGGEST
      ? "| Linha | Tipo | Idioma | Texto | Chave sugerida |"
      : "| Linha | Tipo | Idioma | Texto |");
    md.push(SUGGEST
      ? "|------:|------|--------|-------|----------------|"
      : "|------:|------|--------|-------|");
    for (const f of r.findings) {
      const safe = f.text.replace(/\|/g, "\\|").slice(0, 160);
      const link = `[${f.line}](${r.file}#L${f.line})`;
      if (SUGGEST) {
        md.push(`| ${link} | \`${f.kind}\` | \`${f.lang}\` | ${safe} | \`${f.suggestedKey}\` |`);
      } else {
        md.push(`| ${link} | \`${f.kind}\` | \`${f.lang}\` | ${safe} |`);
      }
    }
    md.push("");
  }
  await fs.writeFile(mdPath, md.join("\n"));

  if (!QUIET) {
    console.log(
      `i18n audit (alvo=${TARGET_LANG}): ${totalFindings} ocorrência(s) em ${report.length} ficheiro(s).`,
    );
    console.log(`  → ${path.relative(ROOT, mdPath)}`);
    console.log(`  → ${path.relative(ROOT, jsonPath)}`);
    if (SUGGEST) console.log(`  → ${path.relative(ROOT, msgsPath)}`);
  }
  if (EMIT_JSON) console.log(JSON.stringify(report, null, 2));

  if (CI_MODE && totalFindings > 0) {
    console.error(
      `\n✖ i18n-audit (--ci): ${totalFindings} ocorrência(s). Ver reports/i18n-audit.md`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});