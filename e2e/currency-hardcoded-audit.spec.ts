import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Static UI audit: fails if any component still prints a hardcoded
 * currency symbol (€, R$, £) next to a numeric value instead of using
 * `formatCurrency` / `formatEUR`.
 */
test("no hardcoded currency symbols in the UI", async () => {
  const script = path.resolve(process.cwd(), "scripts/currency-audit.mjs");
  expect(existsSync(script), "currency-audit script must exist").toBe(true);

  const res = spawnSync(process.execPath, [script], { encoding: "utf8" });
  const output = `${res.stdout}\n${res.stderr}`.trim();
  expect(res.status, `currency-audit failed:\n${output}`).toBe(0);
});
