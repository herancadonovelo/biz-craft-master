import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test("Editor · Amigurumis & Crochê — adiciona carreira sem redirecionar", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, /amigurumis|crochê/i);
  const addRow = page.getByRole("button", { name: /^Carreira$/ }).first();
  await expect(addRow).toBeVisible();
  await addRow.click();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});