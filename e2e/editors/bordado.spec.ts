import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test("Editor · Bordado — abre sem redirect e mostra área de exportação", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, /bordado/i);
  // ExportPanel button label is stable across editors.
  await expect(page.getByRole("button", { name: /exportar|imprimir|guardar/i }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});