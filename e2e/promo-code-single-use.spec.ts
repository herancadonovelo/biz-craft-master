import { test, expect } from "@playwright/test";

/**
 * Verifica que um código promocional Premium vitalício com `max_redemptions=1`
 * só pode ser ativado por uma conta. A segunda tentativa deve mostrar uma
 * mensagem clara ("já foi ativado por outro utilizador").
 *
 * Este teste depende de existirem duas contas de teste no ambiente-alvo,
 * fornecidas via env: E2E_USER_A_EMAIL/PASS e E2E_USER_B_EMAIL/PASS, e do
 * código `252115406SARAAFONSOADMIN` estar ativo. Sem esses envs o teste é
 * ignorado.
 */
const CODE = process.env.E2E_PROMO_CODE || "252115406SARAAFONSOADMIN";
const A = { email: process.env.E2E_USER_A_EMAIL, pass: process.env.E2E_USER_A_PASS };
const B = { email: process.env.E2E_USER_B_EMAIL, pass: process.env.E2E_USER_B_PASS };

async function login(page: import("@playwright/test").Page, email: string, pass: string) {
  await page.goto("/auth");
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel(/palavra-passe/i).first().fill(pass);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 10_000 });
}

test.describe("Código promocional vitalício — uso único", () => {
  test.skip(!A.email || !A.pass || !B.email || !B.pass, "Faltam credenciais E2E");

  test("segunda conta recebe recusa clara", async ({ browser }) => {
    const ctxA = await browser.newContext();
    const pageA = await ctxA.newPage();
    await login(pageA, A.email!, A.pass!);
    await pageA.goto("/planos");
    await pageA.getByPlaceholder(/c[óo]digo/i).fill(CODE);
    await pageA.getByRole("button", { name: /resgatar|aplicar/i }).click();
    await expect(pageA.getByText(/vital[íi]cio|ativado/i)).toBeVisible({ timeout: 8_000 });
    await ctxA.close();

    const ctxB = await browser.newContext();
    const pageB = await ctxB.newPage();
    await login(pageB, B.email!, B.pass!);
    await pageB.goto("/planos");
    await pageB.getByPlaceholder(/c[óo]digo/i).fill(CODE);
    await pageB.getByRole("button", { name: /resgatar|aplicar/i }).click();
    await expect(
      pageB.getByText(/j[áa] foi ativado por outro utilizador|n[ãa]o pode ser reutilizado/i),
    ).toBeVisible({ timeout: 8_000 });
    await ctxB.close();
  });
});