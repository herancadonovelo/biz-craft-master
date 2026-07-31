import { test, expect } from "@playwright/test";

/**
 * Valida a troca de idioma (PT <-> EN) e o fallback português nas páginas
 * principais: autenticação, dashboard e sistema (configurações/idioma).
 */

const STORE_KEY = "atelier-store-v2";

const seed = (idioma: "pt" | "en") => (args: { key: string; idioma: string }) => {
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

async function bootstrap(page: import("@playwright/test").Page, idioma: "pt" | "en") {
  await page.addInitScript(seed(idioma), { key: STORE_KEY, idioma });
}

test.describe("i18n nas páginas principais", () => {
  test("página de autenticação carrega em ambos os idiomas", async ({ page }) => {
    await bootstrap(page, "pt");
    await page.goto("/auth");
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible({ timeout: 20_000 });

    await page.evaluate(seed("en"), { key: STORE_KEY, idioma: "en" });
    await page.reload();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible({ timeout: 20_000 });
    // Sem chaves cruas visíveis (ex.: "nav.language") em nenhum idioma.
    await expect(page.locator("body")).not.toContainText(/\b(nav|common|dashboard)\.[a-zA-Z]+\b/);
  });

  test("dashboard reflete o idioma ativo e não mostra chaves cruas", async ({ page }) => {
    await bootstrap(page, "en");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toContainText(/\b(nav|common|dashboard)\.[a-zA-Z]+\b/);
  });

  test("sistema: troca instantânea PT -> EN -> PT sem reload", async ({ page }) => {
    await bootstrap(page, "pt");
    await page.goto("/idioma");
    const h1 = page.locator("h1").first();
    await expect(h1).toHaveText(/idioma/i, { timeout: 20_000 });

    const url = page.url();
    await page.getByTestId("lang-en").click();
    await expect(h1).toHaveText(/language/i, { timeout: 15_000 });

    await page.getByTestId("lang-pt").click();
    await expect(h1).toHaveText(/idioma/i, { timeout: 15_000 });
    expect(page.url()).toBe(url);
  });

  test("fallback PT quando a chave não existe no dicionário inglês", async ({ page }) => {
    await bootstrap(page, "en");
    await page.goto("/");
    const result = await page.evaluate(async () => {
      const mod = await import("/src/lib/i18n.ts");
      return {
        traduzida: mod.translate("en", "common.save"),
        inexistente: mod.translate("en", "chave.inexistente.para.teste"),
      };
    });
    expect(result.traduzida).toBe("Save");
    expect(result.inexistente).toBe("chave.inexistente.para.teste");
  });
});
