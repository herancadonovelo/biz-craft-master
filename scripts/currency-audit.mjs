#!/usr/bin/env node
// Lint-style audit: fails when the UI contains hardcoded currency symbols
// next to numeric values instead of using `formatCurrency`/`formatEUR`.
//
// The scan intentionally IGNORES pure labels such as `Preço (€)` or
// `€/h`, because those describe an input field's unit and don't render
// a monetary value the user's preferred currency needs to override.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC  = join(ROOT, "src");

// Files that legitimately declare/format the money symbols themselves.
const ALLOWLIST = new Set([
  "src/lib/store.ts",
  "src/lib/i18n.ts",
  "src/lib/print-fatura.ts",
  "src/lib/embroidery-phase21.ts",
  "src/lib/ai.functions.ts",
  "src/lib/subscription.tsx",
  "src/lib/embroidery-phase18.ts",
  "src/routes/moeda.tsx",
]);

// Patterns that indicate a *displayed monetary value* using a fixed symbol.
// We look for a symbol adjacent to a number, template value, or `toFixed`
// expression.
const PATTERNS = [
  { re: /toFixed\([^)]*\)\s*[}]?\s*€/,          desc: "toFixed(...) € literal"       },
  { re: /€\s*\$\{/,                              desc: "€${...} interpolation"        },
  { re: /€\s*\{[^}]+\}/,                         desc: "€{value} in JSX"              },
  { re: /\$\{[^}]+\}\s*€(?!\/)/,                 desc: "${value} € trailing"          },
  { re: /R\$\s*\$?\{?[^}\s]*\d/,                 desc: "R$ next to value"             },
  { re: /£\s*\{[^}]+\}/,                         desc: "£{value} in JSX"              },
];

/** Walk src/ for .ts/.tsx files. */
function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) yield p;
  }
}

const offenders = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  if (ALLOWLIST.has(rel)) continue;

  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    // Ignore comments and JSDoc lines quickly.
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;

    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        offenders.push({ file: rel, line: i + 1, snippet: trimmed, why: p.desc });
        break;
      }
    }
  });
}

if (offenders.length === 0) {
  console.log("✔ currency-audit: no hardcoded currency displays found.");
  process.exit(0);
}

console.error(`✖ currency-audit: ${offenders.length} hardcoded currency display(s):\n`);
for (const o of offenders) {
  console.error(`  ${o.file}:${o.line}  (${o.why})`);
  console.error(`    ${o.snippet}`);
}
console.error(`\nUse formatCurrency(value) / formatEUR(value) from @/lib/store instead.`);
process.exit(1);
