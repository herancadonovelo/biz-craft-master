import { test, expect, type Page } from "@playwright/test";

/**
 * Cenário: o utilizador tinha personalizações guardadas numa versão antiga do
 * store (v2), a app é atualizada (migração v2 → v3) e ele volta a entrar
 * (logout + login). A UI de personalização (/design) tem de refletir
 * exatamente os valores preservados em persisted.design.
 */
const STORE_KEY = "atelier-store-v2";

const PERSONALIZADO = {
  modo: "dark",
  accent: "0.7 0.16 15", // Rose
  fonteTitulos: "'Playfair Display', serif",
  fonteTexto: "Merriweather, serif",
  fonteMenu: "Rubik, sans-serif",
  nomeNegocio: "Atelier Júlia",
  precoHoraBase: 17.5,
  fontSizeBase: 19,
  fundoOpacidade: 0.35,
  raio: 0.4,
} as const;

const seedV2 = ([key, design]: readonly [string, Record<string, unknown>]) => {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      state: { design, initialLanguageChosen: true, onboardingFeito: true },
      version: 2,
    }),
  );
};

const readDesign = (page: Page) =>
  page.evaluate((k) => {
    const raw = window.localStorage.getItem(k);
    return raw ? (JSON.parse(raw).state?.design as Record<string, unknown> | undefined) ?? null : null;
  }, STORE_KEY);

async function abrirDesign(page: Page) {
  await page.goto("/design");
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Modo", { exact: true }).first()).toBeVisible();
}

async function validarUI(page: Page, contexto: string) {
  // Modo escuro selecionado e aplicado no DOM.
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")), {
      message: `modo escuro ${contexto}`,
    })
    .toBe(true);

  // Campo (input/select) associado a uma etiqueta — as etiquetas são
  // traduzidas, por isso aceitamos PT e EN.
  const campo = (etiqueta: RegExp, tag: "input" | "select") =>
    page
      .locator("div")
      .filter({ has: page.locator("label").filter({ hasText: etiqueta }) })
      .last()
      .locator(tag)
      .first();

  await expect(campo(/^(Nome do negócio|Business name)$/, "input"), `nome do negócio ${contexto}`)
    .toHaveValue(PERSONALIZADO.nomeNegocio);
  await expect(campo(/(Preço-hora base|Base hourly rate)/, "input"), `preço-hora ${contexto}`)
    .toHaveValue(String(PERSONALIZADO.precoHoraBase));

  // Tipos de letra escolhidos aparecem selecionados nos pickers.
  await expect(campo(/(Tipo de letra dos títulos|Title font)/, "select"), `fonte de títulos ${contexto}`)
    .toHaveValue(PERSONALIZADO.fonteTitulos);
  await expect(campo(/(Tipo de letra do texto|Body font|Text font)/, "select"), `fonte de texto ${contexto}`)
    .toHaveValue(PERSONALIZADO.fonteTexto);
  await expect(campo(/(Tipo de letra do menu|Menu font|Sidebar font)/, "select"), `fonte do menu ${contexto}`)
    .toHaveValue(PERSONALIZADO.fonteMenu);

  // Swatch de destaque ativo (contorno destacado).
  await expect(page.getByRole("button", { name: "Rose" }), `accent ${contexto}`).toHaveClass(
    /border-foreground/,
  );

  // Sliders refletidos nas etiquetas.
  await expect(
    page.locator("label").filter({ hasText: /(Base global|Global base):\s*19px/ }).first(),
    `fontSizeBase ${contexto}`,
  ).toBeVisible();
  await expect(
    page.locator("label").filter({ hasText: /(véu|veil)[^:]*:\s*35%/ }).first(),
    `véu ${contexto}`,
  ).toBeVisible();

  // Tokens CSS derivados do design preservado.
  const radius = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--radius").trim(),
  );
  expect(radius, `--radius ${contexto}`).toContain("0.4");
}

test.describe("upgrade + login: UI de personalização reflete persisted.design", () => {
  test("valores personalizados sobrevivem à migração e ao novo login", async ({ page }) => {
    await page.addInitScript(seedV2, [STORE_KEY, { ...PERSONALIZADO }] as const);

    // 1) Primeiro arranque após o upgrade: migração v2 → v3.
    await abrirDesign(page);
    const migrado = await readDesign(page);
    for (const [k, v] of Object.entries(PERSONALIZADO)) {
      expect(migrado?.[k], `campo ${k} após migração`).toEqual(v);
    }
    await validarUI(page, "após migração");

    // 2) Logout: limpa a sessão e volta à página de autenticação.
    await page.evaluate(() => {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => window.localStorage.removeItem(k));
    });
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    // 3) Login de volta à app: a UI continua a mostrar o design preservado.
    await abrirDesign(page);
    const depois = await readDesign(page);
    for (const [k, v] of Object.entries(PERSONALIZADO)) {
      expect(depois?.[k], `campo ${k} após login`).toEqual(v);
    }
    await validarUI(page, "após login");
  });
});
