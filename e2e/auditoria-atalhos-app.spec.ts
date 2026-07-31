import { test, expect } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Auditoria global: percorre TODAS as rotas da app (ficheiros em src/routes)
 * e confirma que nenhuma categoria/atalho é redirecionada para o splash
 * screen nem provoca recarga total da página.
 */
const STORE_KEY = "atelier-store-v2";

function rotas(): string[] {
  const dir = join(process.cwd(), "src/routes");
  const out: string[] = [];
  const walk = (d: string, prefix: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith("__") || e.name.startsWith("[") || e.name === "api") continue;
      const p = join(d, e.name);
      if (e.isDirectory()) { walk(p, `${prefix}/${e.name}`); continue; }
      if (!e.name.endsWith(".tsx")) continue;
      const base = e.name.replace(/\.tsx$/, "");
      if (base.includes("$")) continue; // rotas com parâmetros dinâmicos
      const path = base === "index" ? prefix || "/" : `${prefix}/${base.replace(/\./g, "/")}`;
      out.push(path === "" ? "/" : path);
    }
  };
  walk(dir, "");
  return Array.from(new Set(out)).sort();
}

const seed = (key: string) => {
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  window.localStorage.setItem(key, JSON.stringify(parsed));
  window.localStorage.setItem("atelier-e2e-plan-override", "premium");
};

test("nenhuma rota da app cai no splash screen", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(seed, STORE_KEY);
  // Deixa o splash inicial concluir (corre uma vez por sessão do browser).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-testid='splash-screen']", { state: "detached", timeout: 30_000 }).catch(() => {});

  const todas = rotas().filter((r) => !r.startsWith("/auth") && r !== "/sessao-expirada");
  expect(todas.length).toBeGreaterThan(20);

  const falhas: string[] = [];
  for (const rota of todas) {
    await page.goto(rota, { waitUntil: "domcontentloaded" });
    // O splash já correu nesta sessão: não pode voltar a ficar visível.
    await page
      .waitForFunction(() => {
        const e = document.querySelector("[data-testid='splash-screen']");
        return !e || getComputedStyle(e).display === "none";
      }, undefined, { timeout: 4000 })
      .catch(() => {});
    const estado = await page.evaluate(() => {
      const e = document.querySelector("[data-testid='splash-screen']");
      return {
        splash: !!e && getComputedStyle(e).display !== "none",
        path: window.location.pathname,
      };
    });
    if (estado.splash) falhas.push(`${rota}: mostrou splash`);
    if (estado.path !== rota) falhas.push(`${rota}: redirecionou para ${estado.path}`);
  }
  expect(falhas, `Rotas com comportamento indevido:\n${falhas.join("\n")}`).toEqual([]);
});

test("navegação por atalhos do menu mantém a sessão sem recarga", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(seed, STORE_KEY);
  await page.goto("/");
  await page.waitForSelector("[data-testid='splash-screen']", { state: "detached", timeout: 30_000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => { (window as any).__semRecarga = true; });

  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href^='/']"))
      .map((a) => a.getAttribute("href") || "")
      .filter((h) => h && !h.startsWith("//") && !h.startsWith("/api")),
  );
  const falhas: string[] = [];
  for (const href of Array.from(new Set(hrefs))) {
    const link = page.locator(`a[href="${href}"]`).first();
    if (!(await link.count())) continue;
    await link.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    const estado = await page.evaluate(() => ({
      recarregou: !(window as any).__semRecarga,
      splash: (() => {
        const e = document.querySelector("[data-testid='splash-screen']");
        return !!e && getComputedStyle(e).display !== "none";
      })(),
    }));
    if (estado.recarregou) {
      falhas.push(`${href}: recarga total`);
      await page.evaluate(() => { (window as any).__semRecarga = true; });
    }
    if (estado.splash) falhas.push(`${href}: voltou ao splash`);
  }
  expect(falhas, `Atalhos com recarga/splash:\n${falhas.join("\n")}`).toEqual([]);
});
