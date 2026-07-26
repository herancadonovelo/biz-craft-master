import { test, expect } from "@playwright/test";
import { trackConsoleErrors } from "./_helpers";

test.describe("Editor de Gráficos: Tricô", () => {
  test("abre o separador sem erros e mostra a grelha", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await page.goto("/ferramentas-tecnicas");
    if (await page.getByText(/Premium|Desbloquear/i).first().isVisible().catch(() => false)) {
      test.skip(true, "premium-gated — coberto por technical-editors-premium.spec");
    }
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await expect(page.getByTestId("knit-editor")).toBeVisible({ timeout: 10_000 });
    // Sanity check das sub-abas
    for (const t of [/Gráfico/, /Matemática/, /Colorwork/, /Construção/, /Escrita/, /Testadores/, /Custo/]) {
      await expect(page.getByRole("tab", { name: t })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
});
