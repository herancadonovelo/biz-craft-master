#!/usr/bin/env node
// Generates a compact GitHub Step Summary from Playwright's JSON report.
// Shows pass/fail counts by spec file, slowest specs, and a highlight of
// flakes (tests that passed only after a retry). Safe when the JSON is
// missing (prints a short notice instead of crashing the CI step).
import { readFileSync, existsSync } from "node:fs";

const file = process.argv[2] ?? "playwright-report/results.json";
if (!existsSync(file)) {
  process.stdout.write(`### Playwright report\n\n_No JSON report found at \`${file}\`._\n`);
  process.exit(0);
}

/** @type {any} */
const report = JSON.parse(readFileSync(file, "utf8"));

/** @typedef {{ file: string; title: string; status: string; durationMs: number; retries: number; error?: string }} Row */
/** @type {Row[]} */
const rows = [];

function walk(suite, fileHint) {
  const file = suite.file || fileHint || "(unknown)";
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const last = results[results.length - 1] ?? {};
      rows.push({
        file,
        title: spec.title,
        status: last.status ?? "unknown",
        durationMs: results.reduce((s, r) => s + (r.duration ?? 0), 0),
        retries: Math.max(0, results.length - 1),
        error: last.error?.message,
      });
    }
  }
  for (const s of suite.suites ?? []) walk(s, file);
}
for (const s of report.suites ?? []) walk(s);

const total = rows.length;
const passed = rows.filter((r) => r.status === "passed").length;
const failed = rows.filter((r) => r.status === "failed" || r.status === "timedOut").length;
const flaky = rows.filter((r) => r.status === "passed" && r.retries > 0).length;
const skipped = rows.filter((r) => r.status === "skipped").length;

// Aggregate per spec file.
const perFile = new Map();
for (const r of rows) {
  const f = perFile.get(r.file) ?? { file: r.file, total: 0, passed: 0, failed: 0, flaky: 0, durationMs: 0 };
  f.total++;
  if (r.status === "passed") f.passed++;
  if (r.status === "failed" || r.status === "timedOut") f.failed++;
  if (r.status === "passed" && r.retries > 0) f.flaky++;
  f.durationMs += r.durationMs;
  perFile.set(r.file, f);
}
const perFileRows = [...perFile.values()].sort((a, b) => b.durationMs - a.durationMs);
const slowestTests = [...rows].sort((a, b) => b.durationMs - a.durationMs).slice(0, 10);
const failures = rows.filter((r) => r.status === "failed" || r.status === "timedOut");

const fmt = (ms) => `${(ms / 1000).toFixed(1)}s`;
const short = (p) => p.replace(/^.*\/e2e\//, "e2e/");

let out = "";
out += `### Playwright E2E report\n\n`;
out += `**${passed}/${total} passed** · ${failed} failed · ${flaky} flaky · ${skipped} skipped\n\n`;

out += `#### Per spec file (slowest first)\n\n`;
out += `| Spec | Passed | Failed | Flaky | Duration |\n| --- | ---: | ---: | ---: | ---: |\n`;
for (const f of perFileRows) {
  out += `| \`${short(f.file)}\` | ${f.passed}/${f.total} | ${f.failed} | ${f.flaky} | ${fmt(f.durationMs)} |\n`;
}

out += `\n#### Slowest tests\n\n`;
out += `| Test | Spec | Duration | Retries |\n| --- | --- | ---: | ---: |\n`;
for (const r of slowestTests) {
  out += `| ${r.title} | \`${short(r.file)}\` | ${fmt(r.durationMs)} | ${r.retries} |\n`;
}

if (failures.length) {
  out += `\n#### Failures\n\n`;
  for (const r of failures) {
    out += `- **${r.title}** — \`${short(r.file)}\`\n`;
    if (r.error) out += `  \n  <sub>${r.error.split("\n")[0].slice(0, 240)}</sub>\n`;
  }
}

process.stdout.write(out);
process.exit(failed > 0 ? 0 : 0); // Summary step should never mask test-step exit code.