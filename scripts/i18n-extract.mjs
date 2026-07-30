#!/usr/bin/env node
/**
 * Converte as frases hardcoded encontradas pelo i18n-scan em entradas de
 * dicionário, agrupadas por categoria de página.
 *
 *   node scripts/i18n-extract.mjs           -> gera src/i18n/pending.json
 *   node scripts/i18n-extract.mjs --write   -> além disso, acrescenta as
 *      frases a src/i18n/content/pt.json (registo canónico) e cria as
 *      entradas em falta em src/i18n/content/en.json a apontar para "" (o
 *      runtime faz fallback ao português enquanto estiverem vazias).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const WRITE = process.argv.includes("--write");
const ROOTS = ["src/routes", "src/components"];
const ACCENTED = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;

export const CATEGORIES = {
  auth: /(auth|registo|reset-password|sessao|onboarding|verify)/,
  billing: /(planos|recibos|reembolsos|faturacao|subscricao|pagament|historico-faturas|cashflow|despesas)/,
  editors: /(editor|tricotin|ponto-cruz|amigurumi|costura|knit|embroidery|moodboard|design)/,
  atelier: /(atelier|biblioteca|catalogo|portfolio|mural|moodboards|cursos|notas)/,
  operations: /(encomendas|projetos|clientes|fornecedores|inventario|stock|lista-compras|etiquetas|calendario|todo|horas)/,
  marketing: /(marketing|instagram|etsy|crescimento|contacto|quem-somos)/,
  system: /(configuracoes|idioma|moeda|modulos|sincronizacao|backup|notificacoes|mcp|lovable|privacidade|ajuda)/,
};

function categoryOf(file) {
  for (const [name, re] of Object.entries(CATEGORIES)) if (re.test(file)) return name;
  return file.startsWith("src/components") ? "components" : "misc";
}

function slug(text) {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
    .split("_").slice(0, 6).join("_") || "texto";
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p) && !/\.test\./.test(p)) out.push(p);
  }
  return out;
}

const ptKeys = JSON.parse(readFileSync("src/i18n/pt.json", "utf8"));
const knownValues = new Set(Object.values(ptKeys));
const contentEnPath = "src/i18n/content/en.json";
const contentPtPath = "src/i18n/content/pt.json";
const contentEn = JSON.parse(readFileSync(contentEnPath, "utf8"));
const contentPt = existsSync(contentPtPath) ? JSON.parse(readFileSync(contentPtPath, "utf8")) : {};

const found = new Map();
for (const file of ROOTS.flatMap((r) => walk(r))) {
  const src = readFileSync(file, "utf8");
  const push = (text) => {
    const t = text.trim();
    if (t.length < 3 || t.length > 120) return;
    if (!ACCENTED.test(t)) return;
    if (knownValues.has(t)) return;
    if (!found.has(t)) found.set(t, file);
  };
  for (const m of src.matchAll(/>\s*([^<>{}\n]{3,120}?)\s*</g)) push(m[1]);
  for (const m of src.matchAll(/(?:placeholder|title|aria-label|label)="([^"]{3,120})"/g)) push(m[1]);
}

const entries = [...found.entries()].map(([text, file]) => {
  const category = categoryOf(file);
  return {
    text,
    file,
    category,
    key: `${category}.${slug(text)}`,
    translated: Boolean(contentEn[text]),
    en: contentEn[text] ?? "",
  };
}).sort((a, b) => a.category.localeCompare(b.category) || a.text.localeCompare(b.text));

const pending = entries.filter((e) => !e.translated);
const manifest = {
  generatedAt: new Date().toISOString(),
  total: entries.length,
  pending: pending.length,
  byCategory: Object.fromEntries(
    Object.entries(
      entries.reduce((acc, e) => {
        (acc[e.category] ||= []).push(e);
        return acc;
      }, {}),
    ).map(([k, v]) => [k, { total: v.length, pending: v.filter((e) => !e.translated).length }]),
  ),
  entries,
};
writeFileSync("src/i18n/pending.json", JSON.stringify(manifest, null, 2) + "\n");

if (WRITE) {
  for (const e of entries) {
    contentPt[e.text] = e.text;
  }
  for (const t of Object.keys(contentEn)) {
    if (!(t in contentPt)) contentPt[t] = t;
    if (!(e.text in contentEn)) contentEn[e.text] = "";
  }
  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(contentPtPath, JSON.stringify(sortObj(contentPt), null, 2) + "\n");
  writeFileSync(contentEnPath, JSON.stringify(sortObj(contentEn), null, 2) + "\n");
}

console.log(`Frases detetadas: ${entries.length} | por traduzir: ${pending.length}`);
for (const [cat, s] of Object.entries(manifest.byCategory)) {
  console.log(`  ${cat.padEnd(12)} total ${String(s.total).padStart(4)}  por traduzir ${s.pending}`);
}
if (WRITE) console.log("Ficheiros atualizados: content/pt.json, content/en.json, pending.json");
