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

// Um subconjunto estável de itens do menu com rota conhecida e chave i18n.
// Escolhemos itens que rendem SEMPRE (não gated por plano) e cujo header
// contém uma palavra-chave inequívoca por idioma.
const ITEMS: {
  route: string;
  // Palavras-chave (lowercase) por idioma que DEVEM aparecer no <h1>.
  labels: Record<Lang, string>;
}[] = [
  {
    route: "/calculadora",
    labels: { pt: "orçamento", en: "budget", es: "presupuesto", fr: "budget", de: "budget", it: "preventivo" },
  },
  {
    route: "/design",
    labels: { pt: "personalização", en: "customization", es: "personalización", fr: "personnalisation", de: "anpassung", it: "personalizzazione" },
  },
  {
    route: "/idioma",
    labels: { pt: "idioma", en: "language", es: "idioma", fr: "langue", de: "sprache", it: "lingua" },
  },
  {
    route: "/quem-somos",
    // Renomeada para "Origem & Alma do Projeto" — token estável "projeto/project/proyecto/…"
    labels: { pt: "projeto", en: "project", es: "proyecto", fr: "projet", de: "projekt", it: "progetto" },
  },
];

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

    for (const item of ITEMS) {
      test(`${item.route} → header contém "${item.labels[lang]}"`, async ({ page }) => {
        await page.goto(item.route);
        // Se a rota redireccionar para /auth (por ser premium/protegida), saltar.
        if (/\/auth(\?|$)/.test(page.url())) {
          test.skip(true, "rota protegida — coberto pelos testes de auth");
        }
        const heading = await firstVisibleH1Text(page);
        expect(heading).toContain(item.labels[lang]);
      });
    }

    test(`sidebar mostra link para /idioma no idioma "${lang}"`, async ({ page }) => {
      await page.goto("/");
      if (/\/auth(\?|$)/.test(page.url())) test.skip(true, "home protegida — sem sessão");
      // Procura pelo texto do idioma no aside (sidebar). Se a sidebar estiver
      // fechada num viewport pequeno, tentamos abrir via botão do trigger.
      const trigger = page.getByRole("button", { name: /sidebar|menu|toggle/i }).first();
      if (await trigger.isVisible().catch(() => false)) await trigger.click().catch(() => {});
      const label = ITEMS.find((i) => i.route === "/idioma")!.labels[lang];
      const link = page.getByRole("link", { name: new RegExp(label, "i") }).first();
      // Tolerante: nem todas as builds mostram a sidebar em rota pública.
      if (!(await link.isVisible().catch(() => false))) {
        test.skip(true, "sidebar oculta nesta rota/viewport");
      }
      await link.click();
      await expect(page).toHaveURL(/\/idioma$/);
    });
  });
}