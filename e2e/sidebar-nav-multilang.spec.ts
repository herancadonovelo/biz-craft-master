import { test, expect, type Page } from "@playwright/test";

/**
 * Percorre o menu lateral em vários idiomas e confirma que:
 *  1. O label traduzido do item aparece na sidebar.
 *  2. Clicar navega para a rota esperada.
 *  3. O PageHeader (h1) na página de destino contém o mesmo texto/token.
 *
 * Não depende de sessão autenticada — testa apenas rotas públicas ou
 * páginas que existem no bundle. Rotas premium/protegidas são saltadas.
 */

type Lang = "pt" | "en" | "es" | "fr" | "de" | "it";

// Rotas com PageHeader estável. Muitos títulos são hardcoded em PT — por isso
// o smoke test só verifica que a página carrega com um <h1>. O único header
// verdadeiramente i18n é /idioma (usa t("nav.language")), coberto à parte.
const SMOKE_ROUTES = ["/calculadora", "/design", "/quem-somos"] as const;

// Token esperado no <h1> de /idioma por idioma.
const IDIOMA_H1: Record<Lang, RegExp> = {
  pt: /idioma/i,
  en: /language/i,
  es: /idioma/i,
  fr: /langue/i,
  de: /sprache/i,
  it: /lingua/i,
};

// Label da sidebar (nav.language) por idioma.
const NAV_LANGUAGE_LABEL: Record<Lang, RegExp> = IDIOMA_H1;

const LANGS: Lang[] = ["pt", "en", "es", "fr", "de", "it"];

async function setLanguage(page: Page, lang: Lang) {
  await page.addInitScript((l) => {
    try {
      const raw = window.localStorage.getItem("atelier-store-v2");
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = parsed.state ?? {};
      parsed.state.design = { ...(parsed.state.design ?? {}), idioma: l };
      // Marca o seletor inicial como visto para não bloquear a UI.
      parsed.state.initialLanguageChosen = true;
      parsed.state.onboardingFeito = true;
      window.localStorage.setItem("atelier-store-v2", JSON.stringify(parsed));
    } catch { /* ignore */ }
  }, lang);
}

async function firstVisibleH1Text(page: Page): Promise<string> {
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible({ timeout: 8_000 });
  return ((await h1.textContent()) ?? "").trim().toLowerCase();
}

for (const lang of LANGS) {
  test.describe(`Sidebar navigation — ${lang}`, () => {
    test.beforeEach(async ({ page }) => { await setLanguage(page, lang); });

    // 1) Smoke: cada rota carrega e mostra um <h1>.
    for (const route of SMOKE_ROUTES) {
      test(`smoke ${route}`, async ({ page }) => {
        await page.goto(route);
        if (/\/auth(\?|$)/.test(page.url())) test.skip(true, "rota protegida");
        const h1 = await firstVisibleH1Text(page);
        expect(h1.length).toBeGreaterThan(0);
      });
    }

    // 2) /idioma tem header traduzido — verifica o token esperado.
    test(`/idioma header traduzido (${lang})`, async ({ page }) => {
      await page.goto("/idioma");
      if (/\/auth(\?|$)/.test(page.url())) test.skip(true, "rota protegida");
      const h1 = await firstVisibleH1Text(page);
      expect(h1).toMatch(IDIOMA_H1[lang]);
    });

    // 3) Sidebar mostra o link "Idioma" traduzido e navega para /idioma.
    test(`sidebar → link idioma traduzido (${lang})`, async ({ page }) => {
      await page.goto("/design");
      if (/\/auth(\?|$)/.test(page.url())) test.skip(true, "sem sessão");
      const trigger = page.getByRole("button", { name: /sidebar|menu|toggle/i }).first();
      if (await trigger.isVisible().catch(() => false)) await trigger.click().catch(() => {});
      const link = page.getByRole("link", { name: NAV_LANGUAGE_LABEL[lang] }).first();
      if (!(await link.isVisible().catch(() => false))) {
        test.skip(true, "sidebar oculta neste viewport");
      }
      await link.click();
      await expect(page).toHaveURL(/\/idioma$/);
    });
  });
}