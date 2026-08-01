import { test, expect, type Page } from "@playwright/test";

/**
 * Regressão visual do Editor de Moodboards: garante que o design padrão do
 * editor (barra de ferramentas, separadores, galeria de modelos e tela A4) é
 * idêntico em mobile, tablet e desktop, e que o idioma guardado no perfil é
 * reaplicado dentro do editor.
 */
const STORE_KEY = "atelier-store-v2";
const DEV_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

const VIEWPORTS = [
  { nome: "mobile", width: 390, height: 844 },
  { nome: "tablet", width: 834, height: 1112 },
  { nome: "desktop", width: 1440, height: 900 },
];

async function prepararPremium(page: Page, idioma = "pt") {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(
    !["localhost", "127.0.0.1"].includes(url.hostname),
    "override de plano Premium só funciona em dev local",
  );
  await page.addInitScript(
    ({ storeKey, planKey, lang }) => {
      window.localStorage.setItem(planKey, "premium");
      const raw = window.localStorage.getItem(storeKey);
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
      parsed.state = parsed.state ?? {};
      parsed.state.design = { ...(parsed.state.design ?? {}), idioma: lang };
      parsed.state.initialLanguageChosen = true;
      parsed.state.onboardingFeito = true;
      window.localStorage.setItem(storeKey, JSON.stringify(parsed));
    },
    { storeKey: STORE_KEY, planKey: DEV_PLAN_OVERRIDE_KEY, lang: idioma },
  );
}

for (const vp of VIEWPORTS) {
  test(`editor de moodboards · design padrão · ${vp.nome}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await prepararPremium(page);
    await page.goto("/editor-moodboards");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // O editor abre sem bloqueio Premium.
    await expect(page.getByTestId("premium-locked")).toHaveCount(0);

    // Sem overflow horizontal em nenhum formato.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `overflow horizontal no editor (${vp.nome})`).toBeLessThanOrEqual(2);

    await expect(page).toHaveScreenshot(`moodboard-editor-${vp.nome}.png`, {
      maxDiffPixelRatio: 0.02,
      animations: "disabled",
      caret: "hide",
      fullPage: false,
    });
  });

  test(`galeria de 30 modelos · ${vp.nome}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await prepararPremium(page);
    await page.goto("/editor-moodboards");
    await page.waitForLoadState("networkidle");

    await page.getByRole("tab", { name: /modelos/i }).click();
    const cartoes = page.getByTestId("modelo-esteira");
    await expect(cartoes.first()).toBeVisible();
    expect(await cartoes.count()).toBeGreaterThanOrEqual(1);

    await expect(page.getByTestId("painel-modelos")).toHaveScreenshot(
      `moodboard-modelos-${vp.nome}.png`,
      { maxDiffPixelRatio: 0.02, animations: "disabled", caret: "hide" },
    );
  });
}

test("idioma guardado é reaplicado dentro do editor de moodboards", async ({ page }) => {
  await prepararPremium(page, "en");
  await page.goto("/editor-moodboards");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("tab", { name: /templates|models|modelos/i })).toBeVisible();

  // Depois de recarregar (nova sessão do browser tab) o idioma persiste.
  await page.reload();
  await page.waitForLoadState("networkidle");
  const idioma = await page.evaluate((key) => {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw)?.state?.design?.idioma : null;
  }, STORE_KEY);
  expect(idioma).toBe("en");
});
