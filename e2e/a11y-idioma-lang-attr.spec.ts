import { test, expect, type Page } from "@playwright/test";

/**
 * Acessibilidade do idioma:
 *  1. `<html lang>` acompanha sempre o idioma escolhido (leitores de ecrã e SEO).
 *  2. Os textos localizados (sidebar/cabeçalho) mudam com o atributo.
 *  3. Depois de terminar sessão e voltar a entrar (novo carregamento da app),
 *     o `lang` e os textos continuam no idioma escolhido.
 *  4. O modo automático repõe o idioma do país/browser e propaga entre separadores.
 */

const STORE_KEY = "atelier-store-v2";

async function seedLanguage(page: Page, idioma: string) {
  await page.addInitScript(([key, lang]) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = parsed.state ?? {};
      parsed.state.design = { ...(parsed.state.design ?? {}), idioma: lang };
      parsed.state.initialLanguageChosen = true;
      parsed.state.onboardingFeito = true;
      window.localStorage.setItem(key, JSON.stringify(parsed));
      window.localStorage.setItem("cbm-language-picked-v1", "1");
    } catch { /* ignore */ }
  }, [STORE_KEY, idioma] as const);
}

test("html lang e textos localizados acompanham a troca de idioma", async ({ page }) => {
  await seedLanguage(page, "pt");
  await page.goto("/idioma");

  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "pt", { timeout: 20_000 });

  const h1 = page.locator("h1").first();
  await expect(h1).toHaveText(/idioma/i);

  await page.getByTestId("lang-en").click();
  await expect(html).toHaveAttribute("lang", "en", { timeout: 15_000 });
  await expect(h1).toHaveText(/language/i);

  await page.getByTestId("lang-fr").click();
  await expect(html).toHaveAttribute("lang", "fr", { timeout: 15_000 });
  await expect(h1).toHaveText(/langue/i);
});

test("idioma e lang persistem após terminar sessão e voltar a entrar", async ({ page }) => {
  await seedLanguage(page, "pt");
  await page.goto("/idioma");
  await page.getByTestId("lang-es").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "es", { timeout: 15_000 });

  // Simula sair e reentrar: nova sessão de página (novo bootstrap da app).
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "es", { timeout: 20_000 });
  await expect(page.locator("h1").first()).toHaveText(/idioma/i);

  await page.goto("/auth");
  await expect(page.locator("html")).toHaveAttribute("lang", "es", { timeout: 20_000 });
});

test("idioma automático repõe o idioma do browser e sincroniza entre separadores", async ({ context }) => {
  const page = await context.newPage();
  await seedLanguage(page, "pt");
  await page.goto("/idioma");
  await page.getByTestId("lang-de").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de", { timeout: 15_000 });

  const other = await context.newPage();
  await other.goto("/idioma");
  await expect(other.locator("html")).toHaveAttribute("lang", "de", { timeout: 20_000 });

  await page.getByTestId("lang-auto").click();
  // O browser de teste corre em inglês → automático deve resolver para EN.
  await expect(page.locator("html")).toHaveAttribute("lang", "en", { timeout: 15_000 });
  // E o outro separador acompanha sem reload nem limpeza de dados.
  await expect(other.locator("html")).toHaveAttribute("lang", "en", { timeout: 20_000 });
});
