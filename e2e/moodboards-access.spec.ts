import { test, expect, type Page } from "@playwright/test";

const DEV_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

async function loginOrUsePremiumOverride(page: Page) {
  const email = process.env.E2E_PREMIUM_EMAIL;
  const password = process.env.E2E_PREMIUM_PASSWORD;
  if (email && password) {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password|palavra-passe/i).fill(password);
    await page.getByRole("button", { name: /entrar|sign in/i }).click();
    await expect(page).not.toHaveURL(/\/auth$/, { timeout: 15_000 });
    return;
  }

  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(
    !["localhost", "127.0.0.1"].includes(url.hostname),
    "sem credenciais Premium; override E2E só funciona em dev local",
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => window.localStorage.setItem(key, "premium"), DEV_PLAN_OVERRIDE_KEY);
}

/**
 * Verifica que o Editor de Moodboards está protegido pelo plano Premium.
 * Um utilizador sem sessão é tratado como "light" pelo SubscriptionProvider,
 * portanto deve ver o ecrã bloqueado com CTA de upgrade.
 */
test.describe("Editor de Moodboards — gating Premium", () => {
  test("nega acesso e mostra CTA de upgrade a um utilizador sem Premium", async ({ page }) => {
    await page.goto("/editor-moodboards", { waitUntil: "domcontentloaded" });

    const locked = page.getByTestId("premium-locked");
    await expect(locked).toBeVisible();

    // Identifica a funcionalidade bloqueada
    await expect(locked).toHaveAttribute("data-feature", "Editor de Moodboards");
    await expect(page.getByTestId("premium-locked-title")).toContainText(
      "Editor de Moodboards",
    );

    // Mostra o plano atual do utilizador (Light por defeito quando sem sessão)
    await expect(page.getByTestId("premium-locked-current-plan")).toContainText(
      /plano atual/i,
    );

    // Lista pelo menos alguns benefícios do Premium
    const benefits = page.getByTestId("premium-locked-benefits").locator("li");
    expect(await benefits.count()).toBeGreaterThanOrEqual(3);

    // CTA principal aponta para /planos#premium
    const upgrade = page.getByTestId("premium-locked-upgrade");
    await expect(upgrade).toBeVisible();
    const upgradeHref = await upgrade.locator("xpath=ancestor::a[1]").getAttribute("href");
    expect(upgradeHref).toContain("/planos");
    expect(upgradeHref).toContain("premium");

    // CTA secundário: teste grátis
    await expect(page.getByTestId("premium-locked-trial")).toBeVisible();

    // O editor real NÃO deve renderizar
    await expect(page.getByRole("button", { name: /guardar na aplicação/i })).toHaveCount(0);
    await expect(page.getByText(/assistente ia de design/i)).toHaveCount(0);
  });

  test("/contador mostra bloqueio Premium quando não há Premium", async ({ page }) => {
    await page.goto("/contador", { waitUntil: "domcontentloaded" });
    const locked = page.getByTestId("premium-locked");
    await expect(locked).toBeVisible();
    await expect(locked).toHaveAttribute("data-feature", "Contador de Carreiras & Pontos");
  });

  test("permite acesso ao Editor de Moodboards a um utilizador Premium", async ({ page }) => {
    await loginOrUsePremiumOverride(page);

    await page.goto("/editor-moodboards");
    await expect(page.getByTestId("premium-locked")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /editor de moodboards/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /guardar na aplicação/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /guardar no dispositivo/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /imprimir a4/i })).toBeVisible();
    await expect(page.getByText(/assistente ia de design/i)).toBeVisible();

    await page.getByRole("tab", { name: /texto/i }).click();
    await page.getByRole("button", { name: /inserir texto/i }).click();
    await expect(page.getByDisplayValue(/escreve aqui/i)).toBeVisible();
  });
});