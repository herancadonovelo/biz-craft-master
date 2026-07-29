import { test, expect } from "@playwright/test";

/**
 * A gestão de reembolsos é uma área de administração: o acesso é decidido no
 * servidor (has_role) e a página só mostra os dados quando o utilizador é
 * administrador. Estes testes garantem que ninguém sem sessão/permissões vê
 * pagamentos de clientes.
 */
test.describe("Gestão de reembolsos — acesso", () => {
  test("visitante sem sessão nunca vê pagamentos nem o formulário", async ({ page }) => {
    await page.goto("/gestao-reembolsos", { waitUntil: "domcontentloaded" });

    // Ou é redirecionado para autenticação, ou vê o aviso de falta de permissões.
    await page.waitForTimeout(1500);
    const naAuth = /\/auth/.test(page.url());
    if (!naAuth) {
      await expect(page.getByText(/permissões de administrador/i)).toBeVisible({ timeout: 15_000 });
    }

    await expect(page.getByTestId("form-reembolso")).toHaveCount(0);
    await expect(page.getByTestId("linha-pagamento")).toHaveCount(0);
    await expect(page.getByTestId("linha-historico")).toHaveCount(0);
  });

  test("a política pública de reembolsos continua acessível sem sessão", async ({ page }) => {
    await page.goto("/reembolsos", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/reembolsos$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});