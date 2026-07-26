import { test, expect } from "@playwright/test";

// Fase 3 — Editor de Gráficos: Tricô · Colorwork / Fair Isle.
test.describe("Knit editor · Colorwork (Fase 3)", () => {
  test("mostra paleta, tabela de consumo e alertas de float", async ({ page }) => {
    await page.goto("/ferramentas-tecnicas");
    const tab = page.getByRole("tab", { name: /Tricô/i });
    if (!(await tab.isVisible().catch(() => false))) test.skip(true, "Editor Tricô oculto (sem Premium)");
    await tab.click();
    await page.getByRole("tab", { name: /Colorwork/i }).click();
    await expect(page.getByText("Paleta de fios")).toBeVisible();
    await expect(page.getByText("Consumo estimado")).toBeVisible();
    await expect(page.getByText(/Alertas de float/i)).toBeVisible();
    await expect(page.getByText(/Multiplicador Fair Isle/i)).toBeVisible();
  });
});