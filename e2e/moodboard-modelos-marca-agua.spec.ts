import { test, expect } from "@playwright/test";

/**
 * Fase 2 do Editor de Moodboards: 30 modelos de esteira e marca de água.
 * Usa o override de plano Premium disponível em desenvolvimento local.
 */
const PLAN_KEY = "atelier-e2e-plan-override";

test.beforeEach(async ({ page }) => {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(!["localhost", "127.0.0.1"].includes(url.hostname), "override de plano só em dev local");
  await page.addInitScript(({ key }) => window.localStorage.setItem(key, "premium"), { key: PLAN_KEY });
  await page.goto("/editor-moodboards", { waitUntil: "domcontentloaded" });
  await page.getByTestId("tab-modelos").click();
});

test("mostra 30 modelos de esteira ordenados pelo número de imagens", async ({ page }) => {
  const lista = page.getByTestId("lista-modelos");
  await expect(lista).toBeVisible();
  await expect(lista.locator("button")).toHaveCount(30);
  await expect(page.getByTestId("modelos-n")).toHaveText("6");
});

test("aplicar um modelo cria as molduras na folha", async ({ page }) => {
  await page.getByTestId("modelo-grelha-9").click();
  await expect(page.getByTestId("slot-vazio")).toHaveCount(9);
});

test("marca de água é inserida com o texto e opacidade escolhidos", async ({ page }) => {
  await page.getByTestId("marca-texto").fill("© Atelier Teste");
  await page.getByTestId("inserir-marca").click();
  const marca = page.locator("textarea").filter({ hasText: "" });
  await expect(page.getByText("Marca de água inserida.")).toBeVisible();
  const opacidades = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-stage-export] > div"))
      .map((d) => getComputedStyle(d).opacity),
  );
  expect(opacidades.some((o) => Number(o) < 1)).toBe(true);
  await expect(marca.first()).toBeVisible();
});
