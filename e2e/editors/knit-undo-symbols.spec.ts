import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Editor de Tricô — undo/redo + símbolos personalizados", () => {
  test("undo/redo funciona no gráfico e o gestor de símbolos remove entradas", async ({ page }) => {
    trackConsoleErrors(page);
    // Clear any leftover editor state so the counters are predictable.
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem("cbm:knit-editor:v1");
      } catch { /* noop */ }
      // Auto-answer both prompts opened by "+ Símbolo personalizado".
      const answers = ["cabo-teste", "★"];
      window.prompt = () => answers.shift() ?? "";
    });

    await openEditorTab(page, /Editor de Gráficos: Tricô/i);

    const editor = page.getByTestId("knit-editor");
    await expect(editor).toBeVisible();

    // Undo/Redo buttons exist and start disabled.
    const undo = page.getByTestId("knit-undo");
    const redo = page.getByTestId("knit-redo");
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    // Paint one cell → undo becomes enabled → undo → redo becomes enabled.
    const firstCell = editor.locator('button[title^="C"]').first();
    await firstCell.click();
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(redo).toBeEnabled();

    // Create a custom symbol via the sidebar button and open the manager.
    await page.getByRole("button", { name: /Símbolo personalizado/i }).click();
    const manager = page.getByTestId("knit-manage-symbols");
    await expect(manager).toBeVisible();
    await manager.click();
    const dlg = page.getByTestId("knit-symbols-manager");
    await expect(dlg).toBeVisible();
    await expect(dlg.getByRole("listitem")).toHaveCount(1);

    // Remove and confirm the manager closes / list empties.
    await dlg.getByRole("button", { name: /Remover/i }).click();
    await expect(dlg.getByRole("listitem")).toHaveCount(0);
  });
});