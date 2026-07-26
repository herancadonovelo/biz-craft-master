import { expect, type Page } from "@playwright/test";

const DEV_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

/**
 * Ensures a Premium session exists so /ferramentas-tecnicas renders instead of
 * the paywall. Uses real credentials in CI when provided, otherwise falls back
 * to the dev-only localStorage override that is honoured by the subscription
 * hook on localhost.
 */
export async function ensurePremium(page: Page) {
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
  await page.addInitScript(
    ({ key }) => window.localStorage.setItem(key, "premium"),
    { key: DEV_PLAN_OVERRIDE_KEY },
  );
}

/** Opens the tools hub, selects a tab, and asserts no paywall / redirect. */
export async function openEditorTab(page: Page, tabName: RegExp) {
  await ensurePremium(page);
  await page.goto("/ferramentas-tecnicas", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  await expect(page.getByTestId("premium-locked")).toHaveCount(0);
  const trigger = page.getByRole("tab", { name: tabName });
  await trigger.click();
  await expect(trigger).toHaveAttribute("data-state", "active");
  // Editor should not have navigated away.
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
}

/** Fails the test if any uncaught console error / pageerror occurred. */
export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known noisy network 401s from unauthenticated background probes.
      if (/401|Failed to load resource|net::ERR_/i.test(text)) return;
      errors.push(`console: ${text}`);
    }
  });
  return { errors };
}