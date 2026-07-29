import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editor · Costura", () => {
  test("alterna opções de grelha e snap sem erros", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /costura/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');

    const snap = panel.getByRole("button", { name: /Snap extremos/i }).first();
    await expect(snap).toBeVisible();
    await snap.click();
    const grid2 = panel.getByRole("button", { name: /^2$/ }).first();
    await grid2.click();
    await expect(panel.getByText(/Grelha \(2 cm\)/i)).toBeVisible();
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
    expect(errors).toEqual([]);
  });

  test("guarda uma versão do molde e mostra o diff", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /costura/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    await panel.getByRole("tab", { name: /^Versões$/ }).first().click();

    await panel.getByRole("button", { name: /^Guardar$/ }).first().click();
    const diff = panel.getByRole("button", { name: /Diff/i }).first();
    await expect(diff).toBeVisible();
    await diff.click();
    await expect(panel.getByText(/Diferenças vs versão/i)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("exporta o molde em SVG", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /costura/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    await panel.getByRole("tab", { name: /^CAD$/ }).first().click();

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 20_000 }),
      panel.getByRole("button", { name: /^SVG$/ }).first().click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    expect(errors).toEqual([]);
  });
});
