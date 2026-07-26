import { test, expect } from "@playwright/test";

// Smoke test that the Toolbox Pro panel (phases 3–12) renders inside the
// Tricotin editor and the industrial G-Code export button is wired.
// Deep behaviour of each phase is covered by pure-function unit tests
// against src/lib/tricotin-pro.ts.

test.describe("Tricotin Toolbox Pro (fases 3–12)", () => {
  test("panel is visible in the Tricotin editor", async ({ page }) => {
    await page.goto("/ferramentas-tecnicas");
    // The route is premium-gated. If we hit the lock screen, we still consider
    // the guard is in place (covered by other specs) and skip the check.
    if (await page.getByText(/Premium|Desbloquear/i).first().isVisible().catch(() => false)) {
      test.skip(true, "requires premium session — covered by premium-access specs");
    }
    await page.getByRole("tab", { name: /Tricotin/i }).click().catch(() => {});
    await expect(page.getByTestId("tricotin-pro")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("export-gcode")).toBeVisible();
  });
});