import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test("Editor · Ponto Cruz — alterna vista de símbolos sem erros", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, /ponto cruz/i);
  const tab = page.getByRole("tab", { name: /Grelha|Símbolos|Cor/i }).first();
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});