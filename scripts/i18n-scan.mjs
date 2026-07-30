#!/usr/bin/env node
// Varre componentes/páginas à procura de texto em português escrito
// diretamente no código e que ainda não exista nos dicionários.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["src/routes", "src/components"];
const pt = JSON.parse(readFileSync("src/i18n/pt.json", "utf8"));
const content = JSON.parse(readFileSync("src/i18n/content/en.json", "utf8"));
const known = new Set([...Object.values(pt), ...Object.keys(content)]);
const accented = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(p) && !/\.test\./.test(p)) files.push(p);
  }
};
roots.forEach((r) => walk(r));

const missing = new Map();
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/>\s*([^<>{}\n]{3,80}?)\s*</g)) {
    const text = m[1].trim();
    if (!accented.test(text)) continue;
    if (known.has(text)) continue;
    if (!missing.has(text)) missing.set(text, file);
  }
}

const list = [...missing.entries()];
console.log(`Ficheiros analisados: ${files.length}`);
console.log(`Textos por extrair: ${list.length}`);
for (const [text, file] of list.slice(0, 200)) console.log(` - ${file}: ${text}`);
