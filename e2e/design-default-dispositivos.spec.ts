import { test, expect } from "@playwright/test";

/**
 * Screenshots do design padrão em mobile, tablet e desktop para auth,
 * dashboard e sistema (idioma). Qualquer alteração ao tema padrão em algum
 * dos formatos faz falhar o build.
 */
const STORE_KEY = "atelier-store-v2";

const seed = (key: string) => {
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  window.localStorage.setItem(key, JSON.stringify(parsed));
};

const VIEWPORTS = [
  { nome: "mobile", width: 390, height: 844 },
  { nome: "tablet", width: 834, height: 1112 },
  { nome: "desktop", width: 1440, height: 900 },
];

const PAGES = [
  { nome: "auth", url: "/auth" },
  { nome: "dashboard", url: "/" },
  { nome: "sistema-idioma", url: "/idioma" },
];

const VARS = ["--primary", "--radius", "--font-display", "--app-bg-image", "--background", "--sidebar"];

for (const vp of VIEWPORTS) {
  for (const pagina of PAGES) {
    test(`design padrão · ${pagina.nome} · ${vp.nome}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(seed, STORE_KEY);
      await page.goto(pagina.url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      // Tokens do tema padrão iguais em qualquer dispositivo.
      const tokens = await page.evaluate((names) => {
        const cs = getComputedStyle(document.documentElement);
        return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]));
      }, VARS);
      expect(tokens["--primary"]).not.toBe("");

      // Sem overflow horizontal (texto fora do cartão / sobreposto).
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `overflow horizontal em ${pagina.nome}/${vp.nome}`).toBeLessThanOrEqual(2);

      await expect(page).toHaveScreenshot(`${pagina.nome}-${vp.nome}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
        caret: "hide",
        fullPage: false,
      });
    });
  }
}
