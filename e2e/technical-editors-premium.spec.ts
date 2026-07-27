import { test, expect, type Page } from "@playwright/test";

const DEV_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

async function enablePremium(page: Page) {
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
  await page.addInitScript(
    ({ key }) => window.localStorage.setItem(key, "premium"),
    { key: DEV_PLAN_OVERRIDE_KEY },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

test.describe("Ferramentas Técnicas — proteção Premium", () => {
  test("bloqueia os editores técnicos para utilizadores sem Premium", async ({ page }) => {
    await page.goto("/ferramentas-tecnicas", { waitUntil: "domcontentloaded" });

    const locked = page.getByTestId("premium-locked");
    await expect(locked).toBeVisible();
    await expect(locked).toHaveAttribute("data-feature", "Ferramentas Técnicas");
    await expect(page.getByTestId("premium-locked-upgrade")).toBeVisible();

    await expect(page.getByRole("tab", { name: /tricotin/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /amigurumis|crochê/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /ponto cruz/i })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /costura/i })).toHaveCount(0);
  });

  test("rotas diretas de editores Premium não renderizam ferramentas sem Premium", async ({ page }) => {
    const routes = [
      { url: "/conversor-cores", feature: "Conversor de Cores: DMC/ANCHOR" },
      { url: "/contador", feature: "Contador de Carreiras & Pontos" },
    ];

    for (const route of routes) {
      await page.goto(route.url, { waitUntil: "domcontentloaded" });
      const locked = page.getByTestId("premium-locked");
      await expect(locked).toBeVisible();
      await expect(locked).toHaveAttribute("data-feature", route.feature);
    }
  });

  test("Premium abre Tricotin, Crochê/Amigurumi, Ponto Cruz e Costura no hub", async ({ page }) => {
    await enablePremium(page);
    await page.goto("/ferramentas-tecnicas", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("premium-locked")).toHaveCount(0);
    await expect(page.locator('[aria-hidden="true"].fixed.inset-0')).toHaveCount(0, { timeout: 12_000 });

    const tabs = [
      { name: /tricotin/i, control: /adicionar ponto reto/i },
      { name: /amigurumis|crochê/i, control: /carreira/i },
      { name: /costura/i, control: /adicionar linha por medida/i },
      { name: /ponto cruz/i, control: /símbolos/i },
    ];

    for (const tab of tabs) {
      const trigger = page.getByRole("tab", { name: tab.name });
      await trigger.click();
      await expect(trigger).toHaveAttribute("data-state", "active");
      await expect(page.getByRole("button", { name: tab.control }).first()).toBeVisible();
      await expect(page.getByTestId("premium-locked")).toHaveCount(0);
    }
  });
});