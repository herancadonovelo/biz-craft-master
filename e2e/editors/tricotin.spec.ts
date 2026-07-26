import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editor · Tricotin/i-cord", () => {
  test("abre, alterna modos e mostra pré-visualização de tolerância", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /tricotin/i);

    await expect(page.getByRole("button", { name: /Adicionar Ponto Reto/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /Adicionar Ponto Reto/i }).first().click();
    await page.getByRole("button", { name: /Modo Seleção/i }).first().click();
    await page.getByRole("button", { name: /Criar novo molde/i }).first().click();

    // Pro panel + tolerance preview render without navigating away.
    await expect(page.getByTestId("tricotin-pro")).toBeVisible();
    await expect(page.getByTestId("arc-tolerance-preview")).toBeVisible();
    await expect(page.getByTestId("export-gcode")).toBeVisible();
    await expect(page.getByTestId("export-gcode-arcs")).toBeVisible();
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
    expect(errors).toEqual([]);
  });

  test("persiste o estado do canvas ao recarregar a página", async ({ page }) => {
    await openEditorTab(page, /tricotin/i);
    // Seed a canvas snapshot via localStorage that the tab reads on mount.
    await page.evaluate(() => {
      window.localStorage.setItem(
        "tricotin-canvas-state-v1",
        JSON.stringify({
          nodes: [
            { id: "a", x: 120, y: 120, type: "start" },
            { id: "b", x: 220, y: 160, type: "straight" },
          ],
          isClosedPath: false, lineWidthTricotin: 14, mode: "curve",
        }),
      );
      window.localStorage.setItem("ferramentas-tecnicas-tab-v1", "tricotin");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("tab", { name: /tricotin/i })).toHaveAttribute("data-state", "active");
    const stored = await page.evaluate(() => window.localStorage.getItem("tricotin-canvas-state-v1"));
    expect(stored).toContain('"lineWidthTricotin":14');
    expect(stored).toContain('"mode":"curve"');
  });
});