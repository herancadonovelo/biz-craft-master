import { test, expect } from "@playwright/test";

/**
 * Idioma derivado do país: garante que o mapeamento país -> idioma é o que
 * fica guardado no perfil e que o valor guardado é reaplicado ao entrar de
 * novo (login subsequente), em vez de voltar ao idioma do browser.
 */
const STORE_KEY = "atelier-store-v2";

const seed = (args: { key: string; idioma: string }) => {
  // Só semeia uma vez por contexto: a reload não pode repor o idioma inicial,
  // senão o teste de persistência ficaria sempre verde.
  if (window.localStorage.getItem("cbm-e2e-seeded") === "1") return;
  window.localStorage.setItem("cbm-e2e-seeded", "1");
  const raw = window.localStorage.getItem(args.key);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  parsed.state = parsed.state ?? {};
  parsed.state.design = { ...(parsed.state.design ?? {}), idioma: args.idioma };
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  window.localStorage.setItem(args.key, JSON.stringify(parsed));
  window.localStorage.setItem("cbm-language-picked-v1", "1");
};

test("país do registo determina o idioma guardado no perfil", async ({ page }) => {
  await page.goto("/");
  const res = await page.evaluate(async () => {
    const mod = await import("/src/lib/country-language.ts");
    return {
      portugal: mod.languageForCountry("Portugal"),
      espanha: mod.languageForCountry("Espanha"),
      franca: mod.languageForCountry("França"),
      desconhecido: mod.languageForCountry("Atlantis"),
    };
  });
  expect(res).toEqual({ portugal: "pt", espanha: "es", franca: "fr", desconhecido: "en" });
});

test("idioma guardado é reaplicado numa nova sessão", async ({ page }) => {
  // Sessão 1: utilizador escolhe/recebe espanhol.
  await page.addInitScript(seed, { key: STORE_KEY, idioma: "es" });
  await page.goto("/idioma");
  await page.waitForLoadState("networkidle");

  // Sessão 2 (novo carregamento, como um login subsequente): mantém-se ES.
  await page.reload();
  await page.waitForLoadState("networkidle");
  const idioma = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.state?.design?.idioma : null;
  }, STORE_KEY);
  expect(idioma).toBe("es");
});

test("mudar de idioma persiste a escolha para o próximo arranque", async ({ page }) => {
  await page.addInitScript(seed, { key: STORE_KEY, idioma: "pt" });
  await page.goto("/idioma");
  await page.getByTestId("lang-en").click();
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1").first()).toHaveText(/language/i, { timeout: 15_000 });
});
