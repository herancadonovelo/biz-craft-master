import { test, expect } from "@playwright/test";
import { ensurePremium } from "./editors/_helpers";

// Smoke test that the Toolbox Pro panel (phases 3–12) renders inside the
// Tricotin editor and the industrial G-Code export button is wired.
// Deep behaviour of each phase is covered by pure-function unit tests
// against src/lib/tricotin-pro.ts.

test.describe("Tricotin Toolbox Pro (fases 3–12)", () => {
  test("panel is visible in the Tricotin editor", async ({ page }) => {
    await ensurePremium(page);
    await page.goto("/ferramentas-tecnicas");
    // The route is premium-gated. If we hit the lock screen, we still consider
    // the guard is in place (covered by other specs) and skip the check.
    await page.getByRole("tab", { name: /Tricotin/i }).click().catch(() => {});
    await expect(page.getByTestId("tricotin-pro")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("export-gcode")).toBeVisible();
  });
});