import { test, expect } from "@playwright/test";
import { trackConsoleErrors, ensurePremium } from "./_helpers";

test.describe("Editor de Gráficos: Tricô", () => {
  test("abre o separador sem erros e mostra a grelha", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await ensurePremium(page);
    await page.goto("/ferramentas-tecnicas");
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    const editor = page.getByTestId("knit-editor");
    await expect(editor).toBeVisible({ timeout: 10_000 });
    // Sanity check das sub-abas (scoped ao editor para evitar colisão com o tab do hub)
    for (const t of [/1\. Gráfico/i, /2\. Matemática/i, /3\. Colorwork/i, /4\. Construção/i, /5\. Escrita/i, /6\. Testadores/i, /7\. Custo/i]) {
      await expect(editor.getByRole("tab", { name: t })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
