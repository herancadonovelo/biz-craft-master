import { test, expect, type Page } from "@playwright/test";

/**
 * Fase 5 do Editor de Moodboards: seleção múltipla e ações em lote.
 */
const PLAN_KEY = "atelier-e2e-plan-override";
const STORE_KEY = "atelier-store-v2";
const MB_ID = "mb-multi-e2e";

function seed(args: { store: string; plan: string; id: string }) {
  window.localStorage.setItem(args.plan, "premium");
  const raw = window.localStorage.getItem(args.store);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  const texto = (id: string, x: number, y: number) => ({
    id, tipo: "text", x, y, w: 120, h: 40, rotacao: 0, zIndex: 1,
    texto: id, fonte: "Inter", tamanhoFonte: 18, corTexto: "#111", alinhamento: "center",
  });
  parsed.state.moodboards = [{
    id: args.id, titulo: "Multi E2E", tags: [], imagens: [], paleta: [], links: [],
    criadoEm: new Date().toISOString(),
    design: {
      largura: 595, altura: 842, corFundo: "#ffffff",
      elementos: [texto("a", 20, 20), texto("b", 200, 120), texto("c", 400, 300)],
    },
  }];
  window.localStorage.setItem(args.store, JSON.stringify(parsed));
}

const pos = (page: Page, id: string) => page.evaluate((elId) => {
  const n = document.querySelector<HTMLElement>(`[data-el-id="${elId}"]`);
  return n ? { left: n.style.left, top: n.style.top } : null;
}, id);

const camada = (page: Page, id: string) => page.locator(`[data-camada-id="${id}"] [data-testid="camada-selecionar"]`);

test.beforeEach(async ({ page }) => {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(!["localhost", "127.0.0.1"].includes(url.hostname), "override de plano só em dev local");
  await page.addInitScript(seed, { store: STORE_KEY, plan: PLAN_KEY, id: MB_ID });
  await page.goto(`/editor-moodboards?id=${MB_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("painel-camadas")).toBeVisible();
});

test("shift+clique nas camadas cria seleção múltipla com caixa envolvente", async ({ page }) => {
  await camada(page, "a").click();
  await expect(page.getByTestId("barra-selecao-multipla")).toBeHidden();
  await camada(page, "b").click({ modifiers: ["Shift"] });
  await expect(page.getByTestId("selecao-contagem")).toHaveText("2 elementos selecionados");
  await expect(page.getByTestId("caixa-selecao")).toBeVisible();
  await camada(page, "b").click({ modifiers: ["Shift"] });
  await expect(page.getByTestId("barra-selecao-multipla")).toBeHidden();
});

test("Ctrl+A seleciona tudo e o alinhamento em lote alinha entre si", async ({ page }) => {
  await page.getByTestId("selecionar-tudo").click();
  await expect(page.getByTestId("selecao-contagem")).toHaveText("3 elementos selecionados");
  await page.getByTestId("multi-alinhar-esquerda").click();
  await expect.poll(() => pos(page, "b")).toEqual({ left: "20px", top: "120px" });
  await expect.poll(() => pos(page, "c")).toEqual({ left: "20px", top: "300px" });
});

test("apagar em lote remove todos os elementos selecionados", async ({ page }) => {
  await page.getByTestId("selecionar-tudo").click();
  await page.getByTestId("multi-apagar").click();
  await expect(page.getByTestId("camada-item")).toHaveCount(0);
});

test("duplicar em lote cria cópias e mantém a nova seleção", async ({ page }) => {
  await camada(page, "a").click();
  await camada(page, "b").click({ modifiers: ["Shift"] });
  await page.getByTestId("multi-duplicar").click();
  await expect(page.getByTestId("camada-item")).toHaveCount(5);
  await expect(page.getByTestId("selecao-contagem")).toHaveText("2 elementos selecionados");
});
