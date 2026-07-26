import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test("Editor · Costura — adiciona linha por medida sem erros", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, /costura/i);
  const btn = page.getByRole("button", { name: /Adicionar linha por medida/i }).first();
  await expect(btn).toBeVisible();
  await btn.click();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});