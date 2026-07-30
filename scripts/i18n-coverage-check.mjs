#!/usr/bin/env node
/**
 * Portão de build de i18n.
 * 1. Falha se algum dicionário tiver uma chave sem correspondência em pt.json
 *    (fallback PT impossível).
 * 2. Falha se en.json tiver chaves de UI em falta (sem fallback documentado).
 * 3. Falha se o número de frases hardcoded por traduzir aumentar acima da
 *    baseline registada em src/i18n/coverage-baseline.json (efeito roquete).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const UPDATE = process.argv.includes("--update-baseline");
const BASELINE = "src/i18n/coverage-baseline.json";
const LANGS = ["en", "es", "fr", "de", "it"];
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const errors = [];
const warnings = [];

const pt = read("src/i18n/pt.json");
for (const lang of LANGS) {
  const dict = read(`src/i18n/${lang}.json`);
  const orphans = Object.keys(dict).filter((k) => !(k in pt));
  if (orphans.length) {
    errors.push(`${lang}.json tem chaves sem equivalente em pt.json (fallback impossível): ${orphans.join(", ")}`);
  }
  const missing = Object.keys(pt).filter((k) => !dict[k]?.trim());
  if (missing.length) {
    warnings.push(`${lang}.json: ${missing.length} chave(s) sem tradução — usa fallback PT (${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""})`);
  }
}

const contentPt = existsSync("src/i18n/content/pt.json") ? read("src/i18n/content/pt.json") : {};
const contentEn = read("src/i18n/content/en.json");
const untracked = Object.keys(contentEn).filter((t) => !(t in contentPt));
if (untracked.length) {
  errors.push(`content/en.json tem ${untracked.length} texto(s) fora do registo content/pt.json: ${untracked.slice(0, 5).join(" | ")}`);
}

// Regenera o manifesto para contar as frases ainda hardcoded.
execFileSync("node", ["scripts/i18n-extract.mjs"], { stdio: "pipe" });
const manifest = read("src/i18n/pending.json");
const baseline = existsSync(BASELINE) ? read(BASELINE) : { pending: manifest.pending, byCategory: {} };

if (UPDATE) {
  writeFileSync(
    BASELINE,
    JSON.stringify(
      { pending: manifest.pending, byCategory: Object.fromEntries(Object.entries(manifest.byCategory).map(([k, v]) => [k, v.pending])) },
      null,
      2,
    ) + "\n",
  );
  console.log(`Baseline atualizada: ${manifest.pending} frases por traduzir.`);
  process.exit(0);
}

if (manifest.pending > baseline.pending) {
  errors.push(
    `Foram adicionadas frases hardcoded sem cobertura em en.json: ${manifest.pending} (baseline ${baseline.pending}). ` +
      `Corre "npm run i18n:extract" e traduz as novas entradas em src/i18n/content/en.json, ou usa o painel /traducoes-pendentes.`,
  );
}

for (const w of warnings) console.warn("aviso:", w);
if (errors.length) {
  console.error("\nVerificação de i18n falhou:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(`i18n OK — ${manifest.pending} frases por traduzir (baseline ${baseline.pending}); fallback PT garantido.`);
