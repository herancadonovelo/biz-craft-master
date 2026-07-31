import { test, expect } from "@playwright/test";

/**
 * Auditoria de navegação: percorre todos os atalhos do menu lateral e
 * confirma que cada um abre à primeira, sem recarga total da página e sem
 * voltar ao splash screen.
 */
const STORE_KEY = "atelier-store-v2";

const seed = (key: string) => {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
    parsed.state = parsed.state ?? {};
    parsed.state.initialLanguageChosen = true;
    parsed.state.onboardingFeito = true;
    window.localStorage.setItem(key, JSON.stringify(parsed));
    window.localStorage.setItem("atelier-e2e-plan-override", "premium");
  } catch { /* ignore */ }
};

test("nenhum atalho do menu provoca recarga ou volta ao splash", async ({ page }) => {
  await page.addInitScript(seed, STORE_KEY);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Marca a sessão: se houver recarga total, o marcador desaparece.
  await page.evaluate(() => { (window as any).__semRecarga = true; });

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>("nav a[href^='/'], aside a[href^='/']"))
      .map((a) => a.getAttribute("href") || "")
      .filter((h) => h && !h.startsWith("//") && !h.startsWith("/api")),
  );
  const unicos = Array.from(new Set(hrefs)).slice(0, 40);
  expect(unicos.length).toBeGreaterThan(3);

  const falhas: string[] = [];
  for (const href of unicos) {
    const link = page.locator(`a[href="${href}"]`).first();
    if (!(await link.count())) continue;
    await link.click({ force: true }).catch(() => {});
    await page.waitForTimeout(350);
    const estado = await page.evaluate(() => ({
      recarregou: !(window as any).__semRecarga,
      splash: !!document.querySelector("[data-testid='splash-screen']"),
      path: window.location.pathname,
    }));
    if (estado.recarregou) falhas.push(`${href}: recarga total`);
    if (estado.splash) falhas.push(`${href}: voltou ao splash`);
    if (estado.recarregou) {
      await page.evaluate(() => { (window as any).__semRecarga = true; });
    }
  }
  expect(falhas, `Atalhos com redirecionamento indevido:\n${falhas.join("\n")}`).toEqual([]);
});

test("o splash não reaparece após uma recarga na mesma sessão", async ({ page }) => {
  await page.addInitScript(seed, STORE_KEY);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400);
  await expect(page.locator("[data-testid='splash-screen']")).toHaveCount(0);
});
