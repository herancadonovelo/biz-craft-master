import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test("Editor · Ponto Cruz — alterna vista de símbolos sem erros", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, /ponto cruz/i);
  const btn = page.getByRole("button", { name: /^Símbolos$/ }).first();
  await expect(btn).toBeVisible();
  await btn.click();
  await btn.click();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});