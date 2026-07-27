import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

test.describe("Ponto Cruz — versões nomeadas", () => {
  test("guarda uma versão, restaura-a e apaga-a", async ({ page }) => {
    trackConsoleErrors(page);
    await page.addInitScript(() => {
      try {
        // Reset editor + snapshot storage so counts are deterministic.
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith("ponto-cruz-"))
          .forEach((k) => window.localStorage.removeItem(k));
      } catch { /* noop */ }
    });
    await openEditorTab(page, /ponto[\s-]*cruz/i);

    const btn = page.getByTestId("pc-versions-btn");
    await expect(btn).toBeVisible();
    await btn.click();

    const dlg = page.getByTestId("pc-versions-dialog");
    await expect(dlg).toBeVisible();
    await dlg.getByPlaceholder(/Nome da versão/i).fill("v1-baseline");
    await page.getByTestId("pc-versions-save").click();

    // Snapshot appears and can be restored.
    const item = dlg.getByRole("listitem").filter({ hasText: "v1-baseline" });
    await expect(item).toHaveCount(1);
    await item.getByRole("button", { name: /Restaurar/i }).click();

    // Reopen and delete.
    await btn.click();
    await expect(dlg).toBeVisible();
    const item2 = dlg.getByRole("listitem").filter({ hasText: "v1-baseline" });
    await item2.getByRole("button", { name: /Apagar/i }).click();
    await expect(dlg.getByRole("listitem").filter({ hasText: "v1-baseline" })).toHaveCount(0);
  });
});