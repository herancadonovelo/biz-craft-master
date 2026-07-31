#!/usr/bin/env node
/**
 * Relatório dos testes visuais + i18n.
 *
 * Lê o JSON do Playwright (playwright-report/results.json) e produz um resumo
 * legível: que componentes/regiões mudaram, em que idiomas, e onde estão os
 * diffs de screenshot — para corrigir rapidamente.
 *
 *   node scripts/visual-i18n-report.mjs [results.json] [--out reports/visual-i18n-report.md]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = outIdx !== -1 ? args[outIdx + 1] : "reports/visual-i18n-report.md";
const INPUT = args.find((a) => !a.startsWith("--") && a !== OUT) ?? "playwright-report/results.json";

const LANGS = { pt: "Português", en: "English", es: "Español", fr: "Français", de: "Deutsch", it: "Italiano" };

function detectLangs(title) {
  const found = new Set();
  for (const code of Object.keys(LANGS)) {
    const re = new RegExp(`(^|[^a-z])${code}([^a-z]|$)`, "i");
    if (re.test(title)) found.add(code);
  }
  return [...found];
}

function detectRegion(title, file) {
  const t = title.toLowerCase();
  if (t.includes("auth")) return "Autenticação (/auth)";
  if (t.includes("dashboard")) return "Dashboard (/)";
  if (t.includes("sistema") || t.includes("idioma")) return "Sistema · Idioma (/idioma)";
  if (t.includes("sidebar") || t.includes("menu")) return "Navegação lateral";
  if (t.includes("layout")) return "Layout global";
  return file.replace(/^e2e\//, "");
}

function flatten(suite, file = suite.file ?? "", out = []) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const last = results[results.length - 1] ?? {};
      out.push({
        title: spec.title,
        file: spec.file ?? file,
        status: last.status ?? "unknown",
        expected: test.expectedStatus ?? "passed",
        error: last.error?.message ?? "",
        attachments: (last.attachments ?? []).map((a) => a.path ?? a.name).filter(Boolean),
        duration: last.duration ?? 0,
      });
    }
  }
  for (const child of suite.suites ?? []) flatten(child, child.file ?? file, out);
  return out;
}

let raw;
try {
  raw = JSON.parse(readFileSync(INPUT, "utf8"));
} catch {
  console.error(`[visual-i18n-report] Sem resultados em ${INPUT}. Corre primeiro: bun run test:visual`);
  process.exit(0);
}

const tests = (raw.suites ?? []).flatMap((s) => flatten(s));
const relevant = tests.filter((t) => /i18n|visual|idioma|layout/i.test(`${t.file} ${t.title}`));
const failed = relevant.filter((t) => t.status !== t.expected && t.status !== "passed");

const byRegion = new Map();
for (const t of failed) {
  const region = detectRegion(t.title, t.file);
  const langs = detectLangs(t.title);
  if (!byRegion.has(region)) byRegion.set(region, []);
  byRegion.get(region).push({ ...t, langs });
}

const lines = [];
lines.push("# Relatório visual & i18n");
lines.push("");
lines.push(`Gerado a ${new Date().toISOString()} · ${relevant.length} testes analisados · **${failed.length} divergências**`);
lines.push("");

if (failed.length === 0) {
  lines.push("Sem divergências de layout após a troca de idioma. Todas as regiões estão iguais às baselines.");
} else {
  lines.push("| Região / componente | Idiomas afetados | Teste | Diffs |");
  lines.push("| --- | --- | --- | --- |");
  for (const [region, items] of byRegion) {
    for (const it of items) {
      const langs = it.langs.length ? it.langs.map((l) => `${l.toUpperCase()} (${LANGS[l]})`).join(", ") : "—";
      const diffs = it.attachments.filter((a) => /diff|actual|expected/i.test(a));
      lines.push(`| ${region} | ${langs} | ${it.title} | ${diffs.length ? diffs.join("<br>") : "—"} |`);
    }
  }
  lines.push("");
  lines.push("## Detalhe dos erros");
  for (const it of failed) {
    lines.push("");
    lines.push(`### ${it.title}`);
    lines.push("");
    lines.push("```text");
    lines.push((it.error || "sem mensagem").split("\n").slice(0, 12).join("\n"));
    lines.push("```");
  }
  lines.push("");
  lines.push("> Se as diferenças forem intencionais, aprova as novas baselines com:");
  lines.push("> `bun run test:visual:baseline -- --approve`");
}

const md = lines.join("\n") + "\n";
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, md, "utf8");
process.stdout.write(md);

if (failed.length > 0 && process.env.VISUAL_REPORT_STRICT === "1") process.exit(1);
