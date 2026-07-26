import { test, expect } from "@playwright/test";

// Fase 2 — Editor de Gráficos: Tricô · Matemática e Escalonamento.
// Verifica que o painel Grading abre, calcula os 6 tamanhos e formata em parênteses.
test.describe("Knit editor · Grading (Fase 2)", () => {
  test("mostra tabela XS–XXL e string em parênteses", async ({ page }) => {
    await page.goto("/ferramentas-tecnicas");
    // Abre o tab do editor de tricô (pode não estar visível para não-Premium: teste tolerante).
    const tab = page.getByRole("tab", { name: /Tricô/i });
    if (!(await tab.isVisible().catch(() => false))) test.skip(true, "Editor Tricô oculto (sem Premium)");
    await tab.click();
    await page.getByRole("tab", { name: /Matemática/i }).click();
    await expect(page.getByText("Escalonamento automático")).toBeVisible();
    for (const s of ["XS", "S", "M", "L", "XL", "XXL"]) {
      await expect(page.getByRole("cell", { name: s, exact: true })).toBeVisible();
    }
    await expect(page.getByText(/Montar:/)).toContainText("(");
  });
});