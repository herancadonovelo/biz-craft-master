import { test, expect, type Page } from "@playwright/test";

/**
 * Fase 4 do Editor de Moodboards: histórico de edição (undo/redo).
 * Cobre botões, atalhos Ctrl+Z / Ctrl+Shift+Z e agrupamento de arrastos.
 */
const PLAN_KEY = "atelier-e2e-plan-override";
const STORE_KEY = "atelier-store-v2";
const MB_ID = "mb-historico-e2e";

function seed(args: { store: string; plan: string; id: string }) {
  window.localStorage.setItem(args.plan, "premium");
  const raw = window.localStorage.getItem(args.store);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  parsed.state.moodboards = [{
    id: args.id, titulo: "Histórico E2E", tags: [], imagens: [], paleta: [], links: [],
    criadoEm: new Date().toISOString(),
    design: {
      largura: 595, altura: 842, corFundo: "#ffffff",
      elementos: [{
        id: "alvo", tipo: "text", x: 40, y: 40, w: 180, h: 50, rotacao: 0, zIndex: 1,
        texto: "alvo", fonte: "Inter", tamanhoFonte: 20, corTexto: "#111", alinhamento: "center",
      }],
    },
  }];
  window.localStorage.setItem(args.store, JSON.stringify(parsed));
}

const pos = (page: Page, id: string) => page.evaluate((elId) => {
  const n = document.querySelector<HTMLElement>(`[data-el-id="${elId}"]`);
  return n ? { left: n.style.left, top: n.style.top } : null;
}, id);

test.beforeEach(async ({ page }) => {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(!["localhost", "127.0.0.1"].includes(url.hostname), "override de plano só em dev local");
  await page.addInitScript(seed, { store: STORE_KEY, plan: PLAN_KEY, id: MB_ID });
  await page.goto(`/editor-moodboards?id=${MB_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("painel-camadas")).toBeVisible();
});

test("começa sem histórico e os botões estão desativados", async ({ page }) => {
  await expect(page.getByTestId("desfazer")).toBeDisabled();
  await expect(page.getByTestId("refazer")).toBeDisabled();
  await expect(page.getByTestId("historico-passos")).toHaveText("0");
});

test("desfaz e refaz um alinhamento pelos botões", async ({ page }) => {
  const antes = await pos(page, "alvo");
  await page.locator('[data-camada-id="alvo"]').click();
  await page.getByTestId("alinhar-direita").click();
  const depois = await pos(page, "alvo");
  expect(depois).not.toEqual(antes);
  await expect(page.getByTestId("desfazer")).toBeEnabled();

  await page.getByTestId("desfazer").click();
  await expect.poll(() => pos(page, "alvo")).toEqual(antes);
  await expect(page.getByTestId("refazer")).toBeEnabled();

  await page.getByTestId("refazer").click();
  await expect.poll(() => pos(page, "alvo")).toEqual(depois);
});

test("Ctrl+Z desfaz e Ctrl+Shift+Z refaz", async ({ page }) => {
  const antes = await pos(page, "alvo");
  await page.locator('[data-camada-id="alvo"]').click();
  await page.getByTestId("alinhar-fundo").click();
  const depois = await pos(page, "alvo");

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("Control+z");
  await expect.poll(() => pos(page, "alvo")).toEqual(antes);
  await page.keyboard.press("Control+Shift+z");
  await expect.poll(() => pos(page, "alvo")).toEqual(depois);
});

test("apagar uma camada é reversível", async ({ page }) => {
  await page.locator('[data-camada-id="alvo"]').getByRole("button", { name: "Apagar camada" }).click();
  await expect(page.getByTestId("camada-item")).toHaveCount(0);
  await page.getByTestId("desfazer").click();
  await expect(page.getByTestId("camada-item")).toHaveCount(1);
});

test("um arrasto contínuo conta como um único passo de histórico", async ({ page }) => {
  const alvo = page.locator('[data-el-id="alvo"]');
  const box = await alvo.boundingBox();
  const x = box!.x + box!.width / 2, y = box!.y + box!.height / 2;
  await alvo.dispatchEvent("pointerdown", { pointerId: 1, pointerType: "mouse", isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y });
  for (let i = 1; i <= 10; i++) {
    await page.evaluate(([cx, cy]) => {
      window.dispatchEvent(new PointerEvent("pointermove", { clientX: cx as number, clientY: cy as number, bubbles: true, pointerId: 1 }));
    }, [x + i * 8, y + i * 6]);
  }
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 })));
  await expect(page.getByTestId("historico-passos")).toHaveText("1");
});
