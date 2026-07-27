import { test, expect } from "@playwright/test";
import { trackConsoleErrors, ensurePremium } from "./_helpers";

test.describe("Editor de Tricô — Fase 7 (Custo, Stock & Export)", () => {
  test("BOM, breakdown de preço e exportações", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await page.goto("/ferramentas-tecnicas");
    if (await page.getByText(/Premium|Desbloquear/i).first().isVisible().catch(() => false)) {
      test.skip(true, "premium-gated");
    }
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();

    // Pinta pelo menos uma célula com cor no separador 1 para gerar consumo.
    await page.getByRole("tab", { name: /1\. Gráfico/i }).click();
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill("#ff0000");
    // Clica uma célula do gráfico (segundo botão da grelha).
    const grelha = page.locator('button[title^="C1, malha"]').first();
    await grelha.click();

    // Ir para o separador 7.
    await page.getByRole("tab", { name: /Custo & Export/i }).click();
    const panel = page.getByTestId("knit-custo-panel");
    await expect(panel).toBeVisible();

    // A tabela de BOM deve conter a cor pintada.
    await expect(panel.getByText("#ff0000", { exact: false })).toBeVisible();

    // Breakdown reage a alterações de margem.
    await panel.getByLabel("Margem %").fill("100");
    await expect(panel.getByText(/Preço com IVA/i)).toBeVisible();

    // Alerta "sem material mapeado" aparece porque não há inventário.
    await expect(panel.getByText(/sem material mapeado/i)).toBeVisible();

    // Os botões de exportação estão presentes e habilitados.
    await expect(panel.getByRole("button", { name: /CSV BOM/i })).toBeEnabled();
    await expect(panel.getByRole("button", { name: /JSON completo/i })).toBeEnabled();
    await expect(panel.getByRole("button", { name: /PDF/i })).toBeEnabled();

    // Parâmetros persistem após reload.
    await page.reload();
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await page.getByRole("tab", { name: /Custo & Export/i }).click();
    await expect(page.getByTestId("knit-custo-panel").getByLabel("Margem %")).toHaveValue("100");

    expect(errors).toEqual([]);
  });
});