import { test, expect, type Page } from "@playwright/test";

const DEV_PLAN_OVERRIDE_KEY = "atelier-e2e-plan-override";

type TesterProgress = {
  token: string;
  autor: string;
  atual: number;
  totalRows: number;
  iniciado: number;
  ultimo: number;
  concluido?: boolean;
  consumoRealG?: number;
  tamanhoUsado?: string;
  notas: { row: number; autor: string; texto: string; ts: number; tipo: "erro" | "sugestao" | "tamanho" | "consumo" }[];
};

function makeProgress(partial: Partial<TesterProgress> & { token: string; totalRows: number }): TesterProgress {
  const now = Date.now();
  return {
    autor: "tester",
    atual: 1,
    iniciado: now,
    ultimo: now,
    notas: [],
    ...partial,
  };
}

async function usePremiumOverride(page: Page) {
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
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080");
  test.skip(
    !["localhost", "127.0.0.1"].includes(url.hostname),
    "sem credenciais Premium; override E2E só funciona em dev local",
  );
  await page.addInitScript(
    ({ key }) => window.localStorage.setItem(key, "premium"),
    { key: DEV_PLAN_OVERRIDE_KEY },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

async function importFiles(page: Page, files: { name: string; body: unknown }[]) {
  await page.getByTestId("feedback-file-input").setInputFiles(
    files.map((f) => ({
      name: f.name,
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(f.body), "utf8"),
    })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Gating — utilizador sem Premium é bloqueado com CTA de upgrade
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Consolidador de feedback — gating Premium", () => {
  test("nega acesso a utilizador Light e mostra CTA para /planos#premium", async ({ page }) => {
    await page.goto("/consolidar-feedback", { waitUntil: "domcontentloaded" });

    const locked = page.getByTestId("premium-locked");
    await expect(locked).toBeVisible();
    await expect(locked).toHaveAttribute("data-feature", "Consolidação de Feedback de Testers");
    await expect(page.getByTestId("premium-locked-title"))
      .toContainText(/consolida/i);

    const upgrade = page.getByTestId("premium-locked-upgrade");
    await expect(upgrade).toBeVisible();
    const href = await upgrade.locator("xpath=ancestor::a[1]").getAttribute("href");
    expect(href).toContain("/planos");
    expect(href).toContain("premium");

    // O consolidador real NÃO deve renderizar
    await expect(page.getByTestId("feedback-consolidator")).toHaveCount(0);
    await expect(page.getByTestId("feedback-file-input")).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2..9. Fluxo completo — utilizador Premium
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Consolidador de feedback — fluxo Premium", () => {
  test.beforeEach(async ({ page }) => {
    await usePremiumOverride(page);
    await page.goto("/consolidar-feedback", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("premium-locked")).toHaveCount(0);
  });

  test("2. renderiza a página com head SEO e a área de importação", async ({ page }) => {
    await expect(page).toHaveTitle(/consolidar feedback/i);
    await expect(page.getByRole("heading", { name: /consolidar feedback/i })).toBeVisible();
    await expect(page.getByTestId("feedback-consolidator")).toBeVisible();
    await expect(page.getByTestId("feedback-file-input")).toBeAttached();
    // Antes de importar não há stats visíveis
    await expect(page.getByTestId("stat-testers")).toHaveCount(0);
  });

  test("3. importa um único feedback e apresenta os stats agregados", async ({ page }) => {
    const p = makeProgress({
      token: "t-solo",
      autor: "Ana",
      totalRows: 20,
      atual: 20,
      concluido: true,
      consumoRealG: 110,
      tamanhoUsado: "M",
      notas: [{ row: 3, autor: "Ana", texto: "confuso", tipo: "sugestao", ts: Date.now() }],
    });
    await importFiles(page, [{ name: "ana.json", body: p }]);

    await expect(page.getByTestId("stat-testers")).toContainText("1");
    await expect(page.getByTestId("stat-concluidos")).toContainText("1");
    await expect(page.getByTestId("stat-consumo")).toContainText("110");
    await expect(page.getByTestId("stat-notas")).toContainText("1");
  });

  test("4. combina múltiplos ficheiros e calcula média de consumo e heatmap", async ({ page }) => {
    const a = makeProgress({
      token: "t-a", autor: "Ana", totalRows: 20, atual: 20, concluido: true,
      consumoRealG: 100, tamanhoUsado: "M",
      notas: [
        { row: 5, autor: "Ana", texto: "erro no aumento", tipo: "erro", ts: Date.now() },
        { row: 5, autor: "Ana", texto: "confuso", tipo: "sugestao", ts: Date.now() },
      ],
    });
    const b = makeProgress({
      token: "t-b", autor: "Rita", totalRows: 20, atual: 20, concluido: true,
      consumoRealG: 140, tamanhoUsado: "M",
      notas: [{ row: 5, autor: "Rita", texto: "confirmado", tipo: "erro", ts: Date.now() }],
    });
    const c = makeProgress({
      token: "t-c", autor: "Zoé", totalRows: 20, atual: 10,
      tamanhoUsado: "L",
      notas: [{ row: 12, autor: "Zoé", texto: "ok", tipo: "sugestao", ts: Date.now() }],
    });

    await importFiles(page, [
      { name: "a.json", body: a },
      { name: "b.json", body: b },
      { name: "c.json", body: c },
    ]);

    await expect(page.getByTestId("stat-testers")).toContainText("3");
    await expect(page.getByTestId("stat-concluidos")).toContainText("2");
    await expect(page.getByTestId("stat-consumo")).toContainText("120"); // (100+140)/2
    await expect(page.getByTestId("stat-notas")).toContainText("4");

    const rows = page.getByTestId("rows-heatmap").locator("li");
    await expect(rows.first()).toContainText("C5");
    await expect(rows.first()).toContainText("3");
    await expect(rows.nth(1)).toContainText("C12");
  });

  test("5. aceita um ficheiro cujo conteúdo é um array de feedbacks", async ({ page }) => {
    const arr = [
      makeProgress({ token: "arr-1", autor: "Ana", totalRows: 10, atual: 10, concluido: true }),
      makeProgress({ token: "arr-2", autor: "Rita", totalRows: 10, atual: 5 }),
    ];
    await importFiles(page, [{ name: "batch.json", body: arr }]);
    await expect(page.getByTestId("stat-testers")).toContainText("2");
    await expect(page.getByTestId("stat-concluidos")).toContainText("1");
  });

  test("6. rejeita JSON inválido / não-TesterProgress e mostra toast de erro", async ({ page }) => {
    // JSON válido mas não é TesterProgress
    await page.getByTestId("feedback-file-input").setInputFiles([{
      name: "lixo.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ foo: "bar" }), "utf8"),
    }]);
    await expect(page.getByText(/nenhum feedback válido/i)).toBeVisible();
    await expect(page.getByTestId("stat-testers")).toHaveCount(0);
  });

  test("7. permite remover um feedback individual e recalcular", async ({ page }) => {
    const a = makeProgress({ token: "rm-a", autor: "Ana", totalRows: 10, atual: 10, concluido: true });
    const b = makeProgress({ token: "rm-b", autor: "Rita", totalRows: 10, atual: 10, concluido: true });
    await importFiles(page, [{ name: "a.json", body: a }, { name: "b.json", body: b }]);
    await expect(page.getByTestId("stat-testers")).toContainText("2");

    // Remove o primeiro cartão individual (Ana)
    await page.getByTestId("feedback-item-0-remove").click();

    await expect(page.getByTestId("stat-testers")).toContainText("1");
    await expect(page.getByTestId("feedback-item-0")).toContainText("Rita");
    await expect(page.getByTestId("feedback-item-1")).toHaveCount(0);
  });

  test("8. botão 'Limpar tudo' remove todos os feedbacks e esconde os stats", async ({ page }) => {
    const p = makeProgress({ token: "clr", autor: "Ana", totalRows: 5, atual: 5, concluido: true });
    await importFiles(page, [{ name: "a.json", body: p }]);
    await expect(page.getByTestId("stat-testers")).toBeVisible();

    await page.getByRole("button", { name: /limpar tudo/i }).click();
    await expect(page.getByTestId("stat-testers")).toHaveCount(0);
    await expect(page.getByTestId("rows-heatmap")).toHaveCount(0);
  });

  test("9. mostra tamanhos usados agregados por múltiplas testers", async ({ page }) => {
    const files = [
      makeProgress({ token: "sz-1", autor: "Ana", totalRows: 10, atual: 10, concluido: true, tamanhoUsado: "M" }),
      makeProgress({ token: "sz-2", autor: "Rita", totalRows: 10, atual: 10, concluido: true, tamanhoUsado: "M" }),
      makeProgress({ token: "sz-3", autor: "Zoé", totalRows: 10, atual: 10, concluido: true, tamanhoUsado: "L" }),
    ].map((body, i) => ({ name: `sz-${i}.json`, body }));
    await importFiles(page, files);

    const bloco = page.locator("text=Tamanhos usados").locator("xpath=ancestor::div[contains(@class,\"rounded\")][1]");
    await expect(bloco).toContainText("M");
    await expect(bloco).toContainText("L");
    await expect(bloco).toContainText("2");
  });
});