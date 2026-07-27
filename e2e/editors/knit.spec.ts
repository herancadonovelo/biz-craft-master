import { test, expect } from "@playwright/test";
import { trackConsoleErrors, ensurePremium } from "./_helpers";

test.describe("Editor de Gráficos: Tricô", () => {
  test("abre o separador sem erros e mostra a grelha", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await ensurePremium(page);
    await page.goto(\"/ferramentas-tecnicas\");
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await expect(page.getByTestId("knit-editor")).toBeVisible({ timeout: 10_000 });
    // Sanity check das sub-abas
    for (const t of [/Gráfico/, /Matemática/, /Colorwork/, /Construção/, /Escrita/, /Testadores/, /Custo/]) {
      await expect(page.getByRole("tab", { name: t })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
