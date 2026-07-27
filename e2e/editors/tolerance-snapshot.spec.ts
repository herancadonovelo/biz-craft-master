import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

// Snapshot-driven visual regression for the arc tolerance preview: seeds
// a deterministic canvas + tolerance so metrics and overlay SVG are stable
// across runs, then captures the panel's numeric summary + element screenshot.
test.describe("Editor · Tricotin — snapshot de tolerância G-code", () => {
  test("métricas e overlay SVG estáveis com traçado semeado", async ({ page }, testInfo) => {
    const { errors } = trackConsoleErrors(page);

    // Deterministic seed: canvas, active tab, tolerance and disc-limit
    // are populated BEFORE navigation so the tab hydrates with them.
    await page.addInitScript(() => {
      const project = "e2e-snapshot";
      window.localStorage.setItem("tricotin-pro-active-project", project);
      window.localStorage.setItem(`tricotin-pro-tol-v1:${project}`, JSON.stringify(0.15));
      window.localStorage.setItem(`tricotin-pro-max-disc-v1:${project}`, JSON.stringify(50));
      window.localStorage.setItem("ferramentas-tecnicas-tab-v1", "tricotin");
      // Zig-zag path: predictable arc-fitting output.
      const nodes = Array.from({ length: 8 }, (_, i) => ({
        id: `n${i}`,
        x: 200 + i * 40,
        y: 200 + (i % 2 === 0 ? 0 : 30),
        type: i === 0 ? "start" : "straight",
      }));
      window.localStorage.setItem(
        "tricotin-canvas-state-v1",
        JSON.stringify({ nodes, isClosedPath: false, lineWidthTricotin: 12, mode: "line" }),
      );
    });

    await openEditorTab(page, /tricotin/i);

    // Open the "Exportação industrial" details panel that hosts the preview.
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Exportação/i }).click();
    const preview = page.getByTestId("arc-tolerance-preview");
    await preview.scrollIntoViewIfNeeded();
    await expect(preview).toBeVisible();

    // Snapshot the numeric metrics (structured, deterministic text).
    const metrics = {
      arcs: await page.getByTestId("metric-arcs").innerText(),
      lines: await page.getByTestId("metric-lines").innerText(),
      disc: await page.getByTestId("metric-disc").innerText(),
      avg: await page.getByTestId("metric-avg").innerText(),
    };
    testInfo.attach("metrics.json", { body: JSON.stringify(metrics, null, 2), contentType: "application/json" });
    expect(metrics).toMatchSnapshot("tolerance-metrics.json");

    // Snapshot the overlay SVG's serialized structure (independent of pixels).
    const svgOutline = await preview.locator("svg").first().evaluate((el) => {
      const round = (n) => Math.round(parseFloat(n) * 10) / 10;
      const polylines = [...el.querySelectorAll("polyline")].map((p) => ({
        stroke: p.getAttribute("stroke"),
        dash: p.getAttribute("stroke-dasharray") ?? "solid",
        points: (p.getAttribute("points") ?? "").split(/\s+/).filter(Boolean).length,
      }));
      const vb = (el.getAttribute("viewBox") ?? "").split(/\s+/).map(round);
      return { viewBox: vb, polylines };
    });
    expect(svgOutline).toMatchSnapshot("tolerance-overlay.json");

    // Element-level screenshot as an additional visual guard.
    expect(await preview.screenshot()).toMatchSnapshot("tolerance-preview.png", {
      maxDiffPixelRatio: 0.02,
    });

    expect(errors).toEqual([]);
  });

  test("bloqueia export de arcos quando descontinuidades > limite", async ({ page }) => {
    await page.addInitScript(() => {
      const project = "e2e-block";
      window.localStorage.setItem("tricotin-pro-active-project", project);
      // Force a very strict limit so any real path exceeds it.
      window.localStorage.setItem(`tricotin-pro-max-disc-v1:${project}`, JSON.stringify(0));
      window.localStorage.setItem(`tricotin-pro-tol-v1:${project}`, JSON.stringify(0.05));
      window.localStorage.setItem("ferramentas-tecnicas-tab-v1", "tricotin");
      const nodes = [
        { id: "a", x: 100, y: 100, type: "start" },
        { id: "b", x: 160, y: 140, type: "straight" },
        { id: "c", x: 100, y: 180, type: "straight" },
        { id: "d", x: 200, y: 220, type: "straight" },
      ];
      window.localStorage.setItem(
        "tricotin-canvas-state-v1",
        JSON.stringify({ nodes, isClosedPath: false, lineWidthTricotin: 12, mode: "line" }),
      );
    });
    await openEditorTab(page, /tricotin/i);
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Exportação/i }).click();
    await page.getByTestId("arc-tolerance-preview").scrollIntoViewIfNeeded();
    await expect(page.getByTestId("arc-export-blocked")).toBeVisible();
    await expect(page.getByTestId("export-gcode-arcs")).toBeDisabled();
  });

  test("tolerância e presets persistem por projeto ao mudar de scope", async ({ page }) => {
    await openEditorTab(page, /tricotin/i);
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Folha & Histórico/i }).click();
    // Seed distinct configs for two projects and confirm the panel reloads them.
    await page.evaluate(() => {
      window.localStorage.setItem("tricotin-pro-tol-v1:proj-a", JSON.stringify(0.08));
      window.localStorage.setItem("tricotin-pro-tol-v1:proj-b", JSON.stringify(0.42));
      window.localStorage.setItem("tricotin-pro-max-disc-v1:proj-b", JSON.stringify(5));
    });
    const projectInput = page.getByTestId("pro-project-id");
    await projectInput.scrollIntoViewIfNeeded();
    await projectInput.fill("proj-a");
    await projectInput.blur();
    // Tolerance input is the number field with min=0.02 / step=0.05.
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Exportação/i }).click();
    const tol = page.locator('input[type="number"][step="0.05"][min="0.02"]');
    await expect(tol).toHaveValue("0.08");
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Folha & Histórico/i }).click();
    await projectInput.fill("proj-b");
    await projectInput.blur();
    await page.getByTestId("tricotin-pro").getByRole("tab", { name: /Exportação/i }).click();
    await expect(tol).toHaveValue("0.42");
    await expect(page.getByTestId("max-discontinuities")).toHaveValue("5");
  });
});