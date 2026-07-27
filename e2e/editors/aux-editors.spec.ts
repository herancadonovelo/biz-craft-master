import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editores auxiliares — abrem sem erros no hub", () => {
  for (const name of [
    /Editor De Receitas/i,
    /Editor De Moodboards/i,
    /Conversor De Cores/i,
    /Contador De Carreiras/i,
  ]) {
    test(`abre ${name}`, async ({ page }) => {
      const { errors } = trackConsoleErrors(page);
      await openEditorTab(page, name);
      await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
      // Every embedded editor should render some interactive control OR heading.
      const anyControl = page
        .locator('[role="tabpanel"]')
        .locator('button, input, [role="combobox"], [role="textbox"], h1, h2')
        .first();
      await expect(anyControl).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});