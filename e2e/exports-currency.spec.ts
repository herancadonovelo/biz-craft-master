import { test, expect } from "@playwright/test";

/**
 * Verifies that every exporter routed through the UI honours the user's
 * preferred currency and never emits a hardcoded symbol (€, R$, £) next
 * to a numeric value. Also asserts the Phase 23 auto-fix before/after
 * summary keeps rendering through `formatCurrency`/`fmtVal` — i.e. does
 * not regress to raw string concatenation with a fixed money symbol.
 *
 * Runs unit-style via direct module imports, matching the pattern used
 * by `e2e/tricotin-trace-export.spec.ts` — the exporters are pure and
 * the outputs are the exact bytes the UI hands to the browser download.
 */

const HARDCODED = /(?:€|R\$|£)\s*\d|\d[\d.,]*\s*(?:€|R\$|£)(?!\/)/;

function expectNoHardcoded(text: string, currency: string) {
  const match = text.match(HARDCODED);
  expect(
    match,
    `Export for ${currency} contains hardcoded symbol near a value: ${match?.[0]}`,
  ).toBeNull();
}

test("Inventory CSV export uses preferred currency headers and no hardcoded symbols", async () => {
  const { buildInventoryCsv } = await import("../src/lib/embroidery-phase21");
  const report = {
    totalStitches: 100, totalLengthMm: 1000, totalMinutes: 5,
    colorChanges: 1, stops: 1,
    perColor: [{ color: "#ff0000", lengthMm: 1000, stitches: 100 }],
  };
  const materials = [
    { hex: "#ff0000", nome: "DMC 321", codigoCor: "321",
      unidade: "m", precoCompra: 1.5, stock: 10 } as never,
  ];
  const cal = { pxPerMm: 4 } as never;

  for (const cc of ["USD", "BRL", "GBP"] as const) {
    const csv = buildInventoryCsv(report as never, materials, cal, cc);
    expect(csv, "CSV header must include currency code lowercased").toContain(
      `custo_${cc.toLowerCase()}`,
    );
    expect(csv).toContain(`preco_unit_${cc.toLowerCase()}`);
    expectNoHardcoded(csv, cc);
  }
});

test("Configurable production PDF renders totals in preferred currency", async () => {
  const { buildConfigurablePdf } = await import("../src/lib/embroidery-phase21");
  const layout = {
    format: "A4", orientation: "portrait", marginMm: 15,
    title: "Bordado", author: "Tester",
    includeChart: false, includeLegend: true, includeShopping: true,
    includeChecklist: false, includeTiming: true,
  };
  const report = {
    totalStitches: 2000, totalLengthMm: 5000, totalMinutes: 12,
    colorChanges: 2, stops: 2,
    perColor: [
      { color: "#0055aa", lengthMm: 3000, stitches: 1200 },
      { color: "#aa0000", lengthMm: 2000, stitches: 800 },
    ],
  };
  const shoppingRows = [
    { hex: "#0055aa", nome: "DMC 336", codigo: "336",
      stitches: 1200, units: 3, unidade: "m", cost: 4.5, stock: 5 },
    { hex: "#aa0000", nome: "DMC 321", codigo: "321",
      stitches: 800, units: 2, unidade: "m", cost: 3, stock: 1 },
  ];

  const cases: Array<{ cc: string; expectSymbol: string; forbid: RegExp }> = [
    { cc: "USD", expectSymbol: "$",  forbid: /€|R\$|£/ },
    { cc: "BRL", expectSymbol: "R$", forbid: /€|£/ },
    { cc: "GBP", expectSymbol: "£",  forbid: /€|R\$/ },
  ];

  for (const { cc, expectSymbol, forbid } of cases) {
    const bytes = await buildConfigurablePdf({
      layout: layout as never, report: report as never,
      shoppingRows, currencyCode: cc,
    });
    // pdf-lib output is a binary; the drawn text strings appear as raw
    // ASCII inside content streams — good enough to assert symbols.
    const asText = Buffer.from(bytes).toString("latin1");
    expect(asText, `PDF for ${cc} must include its symbol`).toContain(expectSymbol);
    expect(
      asText.match(forbid),
      `PDF for ${cc} must not contain other currency symbols (${forbid})`,
    ).toBeNull();
  }
});

test("Invoice HTML uses formatCurrency for every monetary cell", async () => {
  // We can't call `imprimirFatura` directly (needs window.open), but we
  // verify its module reads through `formatCurrency` and the source has
  // no `€ ${...}` / `${...} €` fragments left behind.
  const src = await import("node:fs").then((fs) =>
    fs.promises.readFile("src/lib/print-fatura.ts", "utf8"),
  );
  expect(src).toContain("formatCurrency");
  expect(src).not.toMatch(/€\s*\$\{/);
  expect(src).not.toMatch(/\$\{[^}]+\}\s*€(?!\/)/);
  expect(src).not.toMatch(/R\$\s*\$?\{/);
});

test("Phase 23 before/after summary renders through formatter, not hardcoded symbols", async () => {
  // Structural: `autoFixOverrides` produces the change payload the UI
  // groups by reason. Assert the payload shape and that the panel
  // source uses `fmtVal(c.from)` / `fmtVal(c.to)` — not raw money
  // symbols — so any currency-bearing field flows through the store's
  // formatter.
  const { autoFixOverrides } = await import("../src/lib/embroidery-phase23");
  const rules = [
    { hex: "#ff0000", stitch: "tatami", density: 8, spacingMm: 0.1,
      underlay: "edge", pullCompMm: 0.2, widthMm: 20, heightMm: 20, areaMm2: 400 },
    { hex: "#00ff00", stitch: "satin", density: 4, spacingMm: 0.25,
      underlay: "none", pullCompMm: 1.5, widthMm: 10, heightMm: 12, areaMm2: 120 },
  ] as never;
  const res = autoFixOverrides(rules, {});
  expect(res.changes.length).toBeGreaterThan(0);
  for (const c of res.changes) {
    expect(typeof c.layerIndex).toBe("number");
    expect(typeof c.field).toBe("string");
    expect(typeof c.reason).toBe("string");
    // Values must remain machine-typed (no pre-formatted currency
    // strings sneaking in): numbers, strings or enums only.
    expect(["number", "string"]).toContain(typeof c.to);
    if (typeof c.to === "string") {
      expect(c.to).not.toMatch(/€|R\$|£/);
    }
  }

  const panelSrc = await import("node:fs").then((fs) =>
    fs.promises.readFile("src/components/embroidery/Phase23Panel.tsx", "utf8"),
  );
  expect(panelSrc, "before/after summary must use fmtVal helper").toContain("fmtVal(c.from)");
  expect(panelSrc).toContain("fmtVal(c.to)");
  // No hardcoded money next to a template value inside the summary UI.
  expect(panelSrc).not.toMatch(/€\s*\{[^}]+\}/);
  expect(panelSrc).not.toMatch(/\{[^}]+\}\s*€(?!\/)/);
});

test("Global currency audit script still passes", async () => {
  const { spawnSync } = await import("node:child_process");
  const res = spawnSync(process.execPath, ["scripts/currency-audit.mjs"], {
    encoding: "utf8",
  });
  expect(res.status, `${res.stdout}\n${res.stderr}`).toBe(0);
});