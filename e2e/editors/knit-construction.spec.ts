import { test, expect } from "@playwright/test";
import { openEditorTab } from "./_helpers";

// Fase 4 — Construção & Acessórios (Raglan, Meia, Agulhas, Marcadores)
test.describe("Editor Tricô — Construção", () => {
  test("mostra wizards, agulha recomendada e gere marcadores", async ({ page }) => {
    await openEditorTab(page, /Editor de Gráficos: Tric[oô]/i);
    await page.getByRole("tab", { name: /construção/i }).click();
    await expect(page.getByTestId("construction-panel")).toBeVisible();

    await expect(page.getByText(/Wizard Top-Down/i)).toBeVisible();
    await expect(page.getByText(/Sock Wizard/i)).toBeVisible();
    await expect(page.getByText(/Agulha sugerida/i).first()).toBeVisible();

    // Adicionar marcador
    await page.getByRole("button", { name: /Adicionar marcador/i }).click();
    await expect(page.getByText(/^m 0/)).toBeVisible();

    // Distribuir 4 marcadores
    await page.getByRole("button", { name: /^Distribuir$/i }).click();
    const marcadores = page.locator("li:has(span.font-mono)");
    await expect(marcadores).toHaveCount(4);

    // Limpar
    await page.getByRole("button", { name: /Limpar todos/i }).click();
    await expect(page.getByText(/Sem marcadores/i)).toBeVisible();
  });
});
