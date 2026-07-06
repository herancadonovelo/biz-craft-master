import { test, expect } from "@playwright/test";

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
    await expect(page.getByRole("heading", { name: /moodboard/i, level: 1 })).toHaveCount(0);
  });

  test("RouteAccessGuard redireciona /contador para / quando não há Premium", async ({ page }) => {
    await page.goto("/contador", { waitUntil: "domcontentloaded" });
    // Guarda faz replace para "/"
    await expect(page).toHaveURL(/\/$|\/index$/, { timeout: 5000 });
  });

  // Cenário positivo — requer credenciais reais de um utilizador Premium.
  // Ativa quando E2E_PREMIUM_EMAIL / E2E_PREMIUM_PASSWORD estiverem definidos.
  test.skip("permite acesso ao Editor de Moodboards a um utilizador Premium", async ({ page }) => {
    const email = process.env.E2E_PREMIUM_EMAIL;
    const password = process.env.E2E_PREMIUM_PASSWORD;
    test.skip(!email || !password, "sem credenciais Premium configuradas");

    await page.goto("/auth");
    await page.getByLabel(/email/i).fill(email!);
    await page.getByLabel(/password|palavra-passe/i).fill(password!);
    await page.getByRole("button", { name: /entrar|sign in/i }).click();

    await page.goto("/editor-moodboards");
    await expect(page.getByTestId("premium-locked")).toHaveCount(0);
    // O editor real deve aparecer (título ou toolbar)
    await expect(page.getByRole("heading", { name: /editor de moodboards/i })).toBeVisible();
  });
});