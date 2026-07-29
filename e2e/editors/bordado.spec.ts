import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editor · Bordado", () => {
  test("abre sem redirect e mostra área de exportação", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /bordado/i);
    await expect(page.getByRole("button", { name: /exportar|imprimir|guardar/i }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
    expect(errors).toEqual([]);
  });

  test("percorre os painéis de fases sem erros", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /bordado/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');

    for (const name of [/^Fase 17$/, /^Fase 18$/, /^Fase 19$/, /^Fase 20$/, /^Fase 21$/, /^Fase 22$/, /^Fase 23$/]) {
      const tab = panel.getByRole("tab", { name }).first();
      await tab.click();
      await expect(tab).toHaveAttribute("data-state", "active");
      // Cada painel deve renderizar algum conteúdo interativo ou textual.
      await expect(
        panel.locator('button:visible, input:visible, p:visible, h3:visible').first(),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("abre o painel de exportação PDF", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await openEditorTab(page, /bordado/i);
    const panel = page.locator('[role="tabpanel"][data-state="active"]');
    const tab = panel.getByRole("tab", { name: /Exportar PDF/i }).first();
    await tab.click();
    await expect(tab).toHaveAttribute("data-state", "active");
    await expect(panel.getByRole("button", { name: /exportar|imprimir|pdf/i }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
    expect(errors).toEqual([]);
  });
});
