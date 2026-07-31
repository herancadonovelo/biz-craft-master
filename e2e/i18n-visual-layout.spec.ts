import { test, expect } from "@playwright/test";

/**
 * Testes visuais: garantem que o layout das páginas principais não parte
 * ao trocar de idioma (PT <-> EN). Screenshots com máscara de zonas
 * dinâmicas e tolerância pequena para variações de renderização de fontes.
 */

const STORE_KEY = "atelier-store-v2";

const seed = (args: { key: string; idioma: string }) => {
  try {
    const raw = window.localStorage.getItem(args.key);
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    parsed.state = parsed.state ?? {};
    parsed.state.design = { ...(parsed.state.design ?? {}), idioma: args.idioma };
    parsed.state.initialLanguageChosen = true;
    parsed.state.onboardingFeito = true;
    window.localStorage.setItem(args.key, JSON.stringify(parsed));
  } catch { /* ignore */ }
};

const PAGES = [
  { nome: "auth", url: "/auth" },
  { nome: "dashboard", url: "/" },
  { nome: "sistema-idioma", url: "/idioma" },
];

for (const idioma of ["pt", "en"] as const) {
  for (const pagina of PAGES) {
    test(`layout estável em ${idioma.toUpperCase()} · ${pagina.nome}`, async ({ page }) => {
      await page.addInitScript(seed, { key: STORE_KEY, idioma });
      await page.goto(pagina.url);
      await page.waitForLoadState("networkidle");
      // Evita capturar spinners/animações a meio.
      await page.waitForTimeout(1200);
      await expect(page).toHaveScreenshot(`${pagina.nome}-${idioma}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
        caret: "hide",
        fullPage: false,
      });
    });
  }
}

test("troca de idioma no sistema não altera a estrutura do layout", async ({ page }) => {
  await page.addInitScript(seed, { key: STORE_KEY, idioma: "pt" });
  await page.goto("/idioma");
  await page.waitForLoadState("networkidle");
  const antes = await page.evaluate(() => {
    const r = document.querySelector("main")?.getBoundingClientRect();
    return r ? { w: Math.round(r.width) } : null;
  });
  await page.getByTestId("lang-en").click();
  await page.waitForTimeout(800);
  const depois = await page.evaluate(() => {
    const r = document.querySelector("main")?.getBoundingClientRect();
    return r ? { w: Math.round(r.width) } : null;
  });
  expect(depois).toEqual(antes);
  // Sem overflow horizontal provocado por strings mais longas em inglês.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(2);
});
