import { test, expect, type Page } from "@playwright/test";

/**
 * Acessibilidade do painel de Camadas: tudo utilizável só com teclado
 * (selecionar, reordenar, bloquear, ocultar, apagar) e com semântica
 * listbox/option correta para leitores de ecrã.
 */
const PLAN_KEY = "atelier-e2e-plan-override";
const STORE_KEY = "atelier-store-v2";
const MB_ID = "mb-teclado-e2e";

function seed(args: { store: string; plan: string; id: string }) {
  window.localStorage.setItem(args.plan, "premium");
  const raw = window.localStorage.getItem(args.store);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  const el = (id: string, y: number, z: number) => ({
    id, tipo: "text", x: 40, y, w: 180, h: 50, rotacao: 0, zIndex: z,
    texto: id, fonte: "Inter", tamanhoFonte: 20, corTexto: "#111", alinhamento: "center",
  });
  parsed.state.moodboards = [{
    id: args.id, titulo: "Teclado E2E", tags: [], imagens: [], paleta: [], links: [],
    criadoEm: new Date().toISOString(),
    design: {
      largura: 595, altura: 842, corFundo: "#ffffff",
      elementos: [el("um", 40, 1), el("dois", 140, 2), el("tres", 240, 3)],
    },
  }];
  window.localStorage.setItem(args.store, JSON.stringify(parsed));
}

const linha = (page: Page, id: string) => page.locator(`[data-camada-id="${id}"]`);
const ordem = (page: Page) =>
  page.locator("[data-camada-id]").evaluateAll((ns) => ns.map((n) => n.getAttribute("data-camada-id")));

test.beforeEach(async ({ page }) => {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(!["localhost", "127.0.0.1"].includes(url.hostname), "override de plano só em dev local");
  await page.addInitScript(seed, { store: STORE_KEY, plan: PLAN_KEY, id: MB_ID });
  await page.goto(`/editor-moodboards?id=${MB_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("painel-camadas")).toBeVisible();
});

test("painel expõe semântica listbox/option acessível", async ({ page }) => {
  const lista = page.getByTestId("painel-camadas");
  await expect(lista).toHaveAttribute("role", "listbox");
  await expect(lista).toHaveAttribute("aria-label", /camadas/i);
  await expect(page.locator('[data-camada-id] >> nth=0')).toHaveAttribute("role", "option");
  // topo da pilha aparece primeiro
  expect(await ordem(page)).toEqual(["tres", "dois", "um"]);
});

test("setas navegam e selecionam sem rato", async ({ page }) => {
  await linha(page, "tres").focus();
  await expect(linha(page, "tres")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowDown");
  await expect(linha(page, "dois")).toBeFocused();
  await expect(linha(page, "dois")).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(linha(page, "um")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(linha(page, "tres")).toBeFocused();
});

test("Ctrl+setas reordenam a pilha sem rato", async ({ page }) => {
  await linha(page, "um").focus();
  await page.keyboard.press("Control+ArrowUp"); // trazer para a frente
  await expect.poll(() => ordem(page)).toEqual(["um", "tres", "dois"]);
  await page.keyboard.press("Control+ArrowDown"); // enviar para trás
  await expect.poll(() => ordem(page)).toEqual(["tres", "dois", "um"]);
});

test("B bloqueia, O oculta e Delete apaga a camada focada", async ({ page }) => {
  await linha(page, "dois").focus();
  await page.keyboard.press("b");
  await expect(linha(page, "dois").getByRole("button", { name: "Desbloquear camada" })).toBeVisible();
  await expect(linha(page, "dois")).toHaveAttribute("aria-label", /bloqueada/i);

  await page.keyboard.press("o");
  await expect(page.locator('[data-stage-export] [data-el-id="dois"]')).toHaveCount(0);
  await expect(linha(page, "dois")).toHaveAttribute("aria-label", /oculta/i);

  await page.keyboard.press("Delete");
  await expect(linha(page, "dois")).toHaveCount(0);
  await expect(page.getByTestId("camada-item")).toHaveCount(2);
});

test("ajuda de teclado está visível para descoberta", async ({ page }) => {
  await expect(page.getByTestId("camadas-ajuda")).toContainText("reordenar");
});
