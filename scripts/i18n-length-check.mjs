#!/usr/bin/env node
// Fails the build if any translatable string in the codebase exceeds the
// TanStack serverFn / translateBatch limit.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const LIMIT = 5000;
const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(tsx?|jsx?|mts|cts)$/.test(name)) out.push(p);
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  let src = readFileSync(file, "utf8");
  // Strip line and block comments so stray apostrophes/quotes in comments
  // don't confuse the naive string-literal regex below.
  src = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
  // Match any string literal (single, double, template) longer than the limit.
  const rx = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/gs;
  let m;
  while ((m = rx.exec(src))) {
    const str = m[2];
    if (str.length > LIMIT) {
      const before = src.slice(0, m.index);
      const line = before.split("\n").length;
      offenders.push({ file: relative(ROOT, file), line, length: str.length, preview: str.slice(0, 60) + "…" });
    }
  }
}

if (offenders.length === 0) {
  console.log(`✓ i18n length check passed (limit ${LIMIT} chars).`);
  process.exit(0);
}

console.error(`\n✗ Found ${offenders.length} translatable string(s) longer than ${LIMIT} chars:\n`);
for (const o of offenders) {
  console.error(`  ${o.file}:${o.line}  (${o.length} chars)  ${o.preview}`);
}
console.error("\nSplit these into shorter paragraphs (e.g. multiple <p> elements) or into numbered i18n keys.\n");
process.exit(1);