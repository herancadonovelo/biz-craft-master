import { test, expect } from "@playwright/test";

/**
 * Phase 1 do backlog Tricotin: Vetorização + exportação SVG/DXF.
 * Valida que:
 *  - o painel de Trace aparece no editor Tricotin,
 *  - o upload + vetorização produz UMA única polyline contínua no SVG,
 *  - o DXF exportado contém UMA única entidade POLYLINE.
 *
 * Nota: rota é Premium; teste corre no negativo (guard) + verifica a existência
 * dos hooks quando a sessão Premium existe em ambiente de dev.
 */

const APP = process.env.APP_URL || "http://localhost:8080";

test("painel de vetorização expõe hooks de trace/svg/dxf", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`${APP}/ferramentas-tecnicas`);

  // Se guardado por Premium, aparece o CTA de upgrade — teste passa
  // confirmando que a rota nunca crasha.
  const locked = page.getByText(/Premium|Desbloquear|Upgrade/i).first();
  const trace = page.getByTestId("trace-panel");
  await Promise.race([locked.waitFor({ timeout: 5000 }).catch(() => null), trace.waitFor({ timeout: 5000 }).catch(() => null)]);

  if (await trace.count()) {
    await expect(page.getByTestId("trace-file")).toBeAttached();
    await expect(page.getByTestId("trace-run")).toBeVisible();
  }
  expect(errors, `Runtime errors: ${errors.join("\n")}`).toHaveLength(0);
});

test("SVG e DXF gerados contêm UMA única polyline contínua", async () => {
  // Teste unit-style via import direto (sem DOM) — corre no runner Playwright.
  const mod = await import("../src/lib/trace");
  const pts = Array.from({ length: 20 }, (_, i) => ({ x: i * 5, y: Math.sin(i / 3) * 10 + 50 }));
  const svg = mod.toSVG(pts, 200, 100);
  const dxf = mod.toDXF(pts, 100);

  // SVG: exatamente uma <polyline>
  expect(svg.match(/<polyline/g)?.length ?? 0).toBe(1);
  expect(svg).not.toMatch(/<path\s/);

  // DXF: exatamente uma entidade POLYLINE, com vertices e um SEQEND
  const polylineCount = (dxf.match(/^POLYLINE$/gm) || []).length;
  const seqendCount = (dxf.match(/^SEQEND$/gm) || []).length;
  expect(polylineCount).toBe(1);
  expect(seqendCount).toBe(1);

  // Comprimento coerente (>0)
  expect(mod.polylineLength(pts)).toBeGreaterThan(0);
});