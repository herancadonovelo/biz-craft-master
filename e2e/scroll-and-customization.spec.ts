import { test, expect } from "@playwright/test";

test.describe("Scroll e personalização", () => {
  test("desbloqueia scroll e cliques quando fica um bloqueio residual no body/html", async ({ page }) => {
    await page.goto("/ajuda", { waitUntil: "domcontentloaded" });

    await page.evaluate(() => {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.pointerEvents = "none";
      document.body.style.touchAction = "none";
      document.body.setAttribute("data-scroll-locked", "1");
    });

    await page.mouse.wheel(0, 700);
    await expect
      .poll(async () => page.evaluate(() => window.scrollY), { timeout: 3000 })
      .toBeGreaterThan(0);

    const state = await page.evaluate(() => ({
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      pointerEvents: document.body.style.pointerEvents,
      touchAction: document.body.style.touchAction,
      scrollLocked: document.body.hasAttribute("data-scroll-locked"),
    }));
    expect(state).toEqual({
      htmlOverflow: "",
      bodyOverflow: "",
      pointerEvents: "",
      touchAction: "",
      scrollLocked: false,
    });
  });

  test("mudar a letra dos cabeçalhos em Personalização aplica nos cabeçalhos", async ({ page }) => {
    await page.goto("/design", { waitUntil: "domcontentloaded" });

    const picker = page.getByTestId("header-font-picker");
    await expect(picker).toBeVisible();
    await picker.selectOption("Pacifico, cursive");

    await expect(page.getByTestId("page-header-title")).toHaveCSS("font-family", /Pacifico/);

    await page.goto("/ajuda", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("page-header-title")).toHaveCSS("font-family", /Pacifico/);
  });
});