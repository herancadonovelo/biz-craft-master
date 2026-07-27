import { test, expect } from "@playwright/test";

// 2FA is opt-in. A user without a verified phone must NOT be forced
// through the enrollment flow — they must be able to reach protected
// surfaces (or land on /auth if the session isn't hydrated). Only users
// who already enrolled a phone get a re-challenge after 24h.
test.describe("2FA is opt-in, not mandatory", () => {
  test("does NOT force /auth/verify-2fa for signed-in user without a verified phone", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("atelier-e2e-plan-override", "premium");
    });
    await page.goto("http://localhost:8080/configuracoes");
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url, `must not hard-redirect to /auth/verify-2fa`).not.toContain("/auth/verify-2fa");
  });

  test("enroll mode: shows phone input + send button, NOT the 'code sent' copy", async ({ page }) => {
    await page.goto("http://localhost:8080/auth/verify-2fa?enroll=1");
    await expect(page.getByPlaceholder(/\+351/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enviar código/i })).toBeVisible();
    // In enroll mode we must NOT claim a code was already sent.
    await expect(page.getByText(/Enviámos um código de 6 dígitos/i)).toHaveCount(0);
    // Code input should not exist until the user actually sends.
    // { exact: true } — the phone input placeholder "+351912345678" contains
    // "123456" as a substring, which would otherwise match the OTP input.
    await expect(page.getByPlaceholder("123456", { exact: true })).toHaveCount(0);
  });

  test("challenge mode: does not fabricate a 'code sent' message before a real send", async ({ page }) => {
    // Simulate the re-challenge landing without an auto-send happening
    // (no auth session in E2E, so autoSend can't fire). The UI must still
    // reflect state truthfully: either no "sent" claim, or the send button
    // is present (i.e. user can trigger the send themselves).
    await page.goto("http://localhost:8080/auth/verify-2fa");
    await page.waitForTimeout(600);
    const codeInputCount = await page.getByPlaceholder("123456", { exact: true }).count();
    if (codeInputCount === 0) {
      // No send happened → the "we sent a code" copy must not be shown.
      await expect(page.getByText(/Enviámos um código de 6 dígitos por SMS\./i)).toHaveCount(0);
      await expect(page.getByRole("button", { name: /enviar código/i })).toBeVisible();
    } else {
      // A send happened → the code input and success toast copy are OK.
      await expect(page.getByPlaceholder("123456", { exact: true })).toBeVisible();
    }
  });

  test("challenge mode logs twofa_otp_sent only after a successful send", async ({ page }) => {
    const events: string[] = [];
    page.on("console", (msg) => {
      const t = msg.text();
      if (t.includes("[session-telemetry]") && t.includes("twofa_")) events.push(t);
    });
    await page.goto("http://localhost:8080/auth/verify-2fa");
    await page.waitForTimeout(800);
    // No successful auto-send in E2E → no twofa_otp_sent must appear.
    expect(events.some((e) => e.includes("twofa_otp_sent"))).toBe(false);
  });
});