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
      // Every embedded editor should render some interactive control.
      await expect(page.getByRole("button").first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});