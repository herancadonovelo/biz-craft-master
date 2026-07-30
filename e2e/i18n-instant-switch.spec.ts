import { test, expect } from "@playwright/test";

/**
 * Confirma que:
 *  1. Trocar de idioma no seletor atualiza a app inteira instantaneamente
 *     (sidebar + header), sem reload.
 *  2. Uma chave sem tradução em inglês cai para o texto português em vez de
 *     mostrar a chave crua ou rebentar.
 */

const STORE_KEY = "atelier-store-v2";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = parsed.state ?? {};
      parsed.state.design = { ...(parsed.state.design ?? {}), idioma: "pt" };
      parsed.state.initialLanguageChosen = true;
      parsed.state.onboardingFeito = true;
      window.localStorage.setItem(key, JSON.stringify(parsed));
    } catch { /* ignore */ }
  }, STORE_KEY);
});

test("troca de idioma aplica-se instantaneamente sem reload", async ({ page }) => {
  await page.goto("/idioma");
  const h1 = page.locator("h1").first();
  await expect(h1).toBeVisible({ timeout: 20_000 });
  await expect(h1).toHaveText(/idioma/i);

  const initialUrl = page.url();
  await page.getByText("English", { exact: true }).first().click();

  await expect(h1).toHaveText(/language/i, { timeout: 10_000 });
  expect(page.url()).toBe(initialUrl); // sem navegação/reload
});

test("fallback: chave sem tradução inglesa mostra o português", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const mod = await import("/src/lib/i18n.ts");
    return {
      traduzida: mod.translate("en", "common.save"),
      semTraducao: mod.translate("en", "nav.help"),
      inexistente: mod.translate("en", "chave.que.nao.existe"),
    };
  });
  expect(result.traduzida).toBe("Save");
  expect(result.semTraducao).toBe("Ajuda & suporte");
  expect(result.inexistente).toBe("chave.que.nao.existe");
});
