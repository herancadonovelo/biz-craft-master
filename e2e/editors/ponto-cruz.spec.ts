import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editor · Ponto Cruz", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith("ponto-cruz-"))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch { /* noop */ }
    });
  });

  test("alterna separadores da grelha sem erros", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /ponto cruz/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    for (const name of [/^Cor$/, /^Texto$/, /Importar\/Exportar/, /^Grelha$/]) {
      const tab = panel.getByRole("tab", { name }).first();
      await tab.click();
      await expect(tab).toHaveAttribute("data-state", "active");
    }
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
    expect(errors).toEqual([]);
  });

  test("pinta células na grelha e desfaz/refaz", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /ponto cruz/i);

    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    const canvas = panel.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const undo = panel.getByTitle(/Desfazer/i).first();
    const redo = panel.getByTitle(/Refazer/i).first();
    await expect(undo).toBeDisabled();

    const box = (await canvas.boundingBox())!;
    for (const [dx, dy] of [[20, 20], [40, 20], [60, 40]]) {
      await page.mouse.move(box.x + dx, box.y + dy);
      await page.mouse.down();
      await page.mouse.up();
    }

    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(redo).toBeEnabled();
    await redo.click();
    await expect(undo).toBeEnabled();
    expect(errors).toEqual([]);
  });

  test("exporta JSON do gráfico", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /ponto cruz/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    await panel.getByRole("tab", { name: /Importar\/Exportar/i }).first().click();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20_000 }),
      panel.getByRole("button", { name: /^JSON$/ }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(errors).toEqual([]);
  });
});
