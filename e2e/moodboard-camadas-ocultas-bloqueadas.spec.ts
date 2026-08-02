import { test, expect, type Page } from "@playwright/test";

/**
 * Painel de Camadas: elementos ocultos não são desenhados (nem exportados,
 * já que o export lê o nó [data-stage-export]) e elementos bloqueados
 * mantêm a posição após alinhamentos e arrasto.
 */
const PLAN_KEY = "atelier-e2e-plan-override";
const STORE_KEY = "atelier-store-v2";
const MB_ID = "mb-camadas-e2e";

function seed(args: { store: string; plan: string; id: string }) {
  window.localStorage.setItem(args.plan, "premium");
  const raw = window.localStorage.getItem(args.store);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  parsed.state.moodboards = [
    {
      id: args.id,
      titulo: "Camadas E2E",
      descricao: undefined,
      tags: [], imagens: [], paleta: [], links: [],
      criadoEm: new Date().toISOString(),
      design: {
        largura: 595, altura: 842, corFundo: "#ffffff",
        elementos: [
          { id: "visivel", tipo: "text", x: 40, y: 40, w: 180, h: 50, rotacao: 0, zIndex: 1, texto: "visivel", fonte: "Inter", tamanhoFonte: 20, corTexto: "#111", alinhamento: "center" },
          { id: "oculta", tipo: "text", x: 40, y: 140, w: 180, h: 50, rotacao: 0, zIndex: 2, texto: "oculta", fonte: "Inter", tamanhoFonte: 20, corTexto: "#111", alinhamento: "center", oculto: true },
          { id: "bloqueada", tipo: "text", x: 200, y: 300, w: 180, h: 50, rotacao: 0, zIndex: 3, texto: "bloqueada", fonte: "Inter", tamanhoFonte: 20, corTexto: "#111", alinhamento: "center", bloqueado: true },
        ],
      },
    },
  ];
  window.localStorage.setItem(args.store, JSON.stringify(parsed));
}

async function pos(page: Page, id: string) {
  return page.evaluate((elId) => {
    const n = document.querySelector<HTMLElement>(`[data-el-id="${elId}"]`);
    return n ? { left: n.style.left, top: n.style.top } : null;
  }, id);
}

const linha = (page: Page, id: string) => page.locator(`[data-camada-id="${id}"]`);

test.beforeEach(async ({ page }) => {
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(!["localhost", "127.0.0.1"].includes(url.hostname), "override de plano só em dev local");
  await page.addInitScript(seed, { store: STORE_KEY, plan: PLAN_KEY, id: MB_ID });
  await page.goto(`/editor-moodboards?id=${MB_ID}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("painel-camadas")).toBeVisible();
});

test("camada oculta não é desenhada nem entra no nó exportado", async ({ page }) => {
  await expect(page.getByTestId("camada-item")).toHaveCount(3);
  const exportNode = page.locator("[data-stage-export]");
  await expect(exportNode.locator('[data-el-id="visivel"]')).toHaveCount(1);
  await expect(exportNode.locator('[data-el-id="oculta"]')).toHaveCount(0);
  await expect(exportNode.locator('[data-el-id="bloqueada"]')).toHaveCount(1);
});

test("mostrar a camada volta a desenhá-la no nó exportado", async ({ page }) => {
  await linha(page, "oculta").getByRole("button", { name: "Mostrar camada" }).click();
  await expect(page.locator('[data-stage-export] [data-el-id="oculta"]')).toHaveCount(1);
  await linha(page, "oculta").getByRole("button", { name: "Ocultar camada" }).click();
  await expect(page.locator('[data-stage-export] [data-el-id="oculta"]')).toHaveCount(0);
});

test("camada bloqueada mantém a posição após alinhamentos", async ({ page }) => {
  const antes = await pos(page, "bloqueada");
  await linha(page, "bloqueada").click();
  for (const tid of ["alinhar-esquerda", "alinhar-direita", "alinhar-topo", "alinhar-fundo", "alinhar-centro-h", "alinhar-centro-v"]) {
    await page.getByTestId(tid).click();
  }
  expect(await pos(page, "bloqueada")).toEqual(antes);
});

test("camada bloqueada mantém a posição após arrasto no canvas", async ({ page }) => {
  const antes = await pos(page, "bloqueada");
  const alvo = page.locator('[data-el-id="bloqueada"]');
  const box = await alvo.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 120, box!.y + box!.height / 2 + 90, { steps: 8 });
  await page.mouse.up();
  expect(await pos(page, "bloqueada")).toEqual(antes);
  // fica selecionada apesar de não se mover
  await expect(linha(page, "bloqueada")).toHaveAttribute("aria-selected", "true");
});

test("camada livre move-se com o arrasto (controlo negativo)", async ({ page }) => {
  const antes = await pos(page, "visivel");
  const box = await page.locator('[data-el-id="visivel"]').boundingBox();
  await page.mouse.move(box!.x + 10, box!.y + 10);
  await page.mouse.down();
  await page.mouse.move(box!.x + 130, box!.y + 100, { steps: 8 });
  await page.mouse.up();
  expect(await pos(page, "visivel")).not.toEqual(antes);
});
