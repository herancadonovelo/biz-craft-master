import { test, expect, type Page } from "@playwright/test";

/**
 * Altera modo, cores, fontes e opacidades em /design e confirma que tudo
 * permanece após reload e após logout/login (a personalização é local ao
 * dispositivo e não deve ser apagada pelo fim de sessão).
 */
const STORE_KEY = "atelier-store-v2";

const seed = (key: string) => {
  const raw = window.localStorage.getItem(key);
  const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
  parsed.state = parsed.state ?? {};
  parsed.state.initialLanguageChosen = true;
  parsed.state.onboardingFeito = true;
  window.localStorage.setItem(key, JSON.stringify(parsed));
};

const readDesign = (page: Page, key: string) =>
  page.evaluate((k) => {
    const raw = window.localStorage.getItem(k);
    return raw ? JSON.parse(raw).state?.design ?? null : null;
  }, STORE_KEY ?? key);

const CUSTOM = {
  modo: "dark",
  accent: "0.55 0.18 25",
  fonteTitulos: "Georgia, serif",
  fonteTexto: "Courier New, monospace",
  janelasOpacidade: 0.6,
  botaoPrimarioOpacidade: 0.45,
  fundoOpacidade: 0.35,
  raio: 0.4,
  fontSizeBase: 19,
  sidebarL: 0.72,
};

test.describe("persistência da personalização de design", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(seed, STORE_KEY);
  });

  test("modo, cores, fontes e opacidades persistem após reload e logout/login", async ({ page }) => {
    await page.goto("/design");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Modo", { exact: true }).first()).toBeVisible();

    // --- Alterações pela UI: modo escuro + um accent da paleta ---
    await page.getByRole("button", { name: "Escuro", exact: true }).first().click();
    const swatches = page.locator("button.flex.flex-col.items-center.gap-1.rounded-md.border");
    if (await swatches.count()) await swatches.nth(1).click();
    await expect
      .poll(async () => (await readDesign(page, STORE_KEY))?.modo)
      .toBe("dark");
    const accentUI = (await readDesign(page, STORE_KEY))?.accent as string;

    // --- Restantes campos (cores, fontes, opacidades, tamanhos) via store ---
    // Os sliders/selects do Radix são acionados por rato; aqui garantimos um
    // conjunto determinista de valores e validamos a persistência real.
    await page.evaluate(
      ([key, custom]) => {
        const raw = window.localStorage.getItem(key as string);
        const parsed = raw ? JSON.parse(raw) : { state: {}, version: 3 };
        parsed.state.design = { ...(parsed.state.design ?? {}), ...(custom as Record<string, unknown>) };
        window.localStorage.setItem(key as string, JSON.stringify(parsed));
      },
      [STORE_KEY, { ...CUSTOM, accent: accentUI || CUSTOM.accent }] as const,
    );

    const esperado = { ...CUSTOM, accent: accentUI || CUSTOM.accent };

    // --- 1) Persistência após reload ---
    await page.reload();
    await page.waitForLoadState("networkidle");
    let design = await readDesign(page, STORE_KEY);
    for (const [k, v] of Object.entries(esperado)) {
      expect(design?.[k], `campo ${k} após reload`).toEqual(v);
    }

    // Reflectido no DOM: modo escuro aplicado e raio/tamanho nos tokens.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    const radius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--radius").trim(),
    );
    expect(radius).toContain("0.4");

    // --- 2) Persistência após logout/login ---
    await page.evaluate(() => {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
        .forEach((k) => window.localStorage.removeItem(k));
    });
    await page.goto("/auth");
    await page.waitForLoadState("networkidle");

    design = await readDesign(page, STORE_KEY);
    for (const [k, v] of Object.entries(esperado)) {
      expect(design?.[k], `campo ${k} após logout`).toEqual(v);
    }

    // "Login" de volta à app: o design continua igual.
    await page.goto("/design");
    await page.waitForLoadState("networkidle");
    design = await readDesign(page, STORE_KEY);
    for (const [k, v] of Object.entries(esperado)) {
      expect(design?.[k], `campo ${k} após login`).toEqual(v);
    }
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
  });

  test("a migração não repõe defaults sobre uma personalização guardada", async ({ page }) => {
    await page.addInitScript(
      ([key, custom]) => {
        window.localStorage.setItem(
          key as string,
          JSON.stringify({ state: { design: custom, initialLanguageChosen: true, onboardingFeito: true }, version: 2 }),
        );
      },
      [STORE_KEY, CUSTOM] as const,
    );
    await page.goto("/design");
    await page.waitForLoadState("networkidle");

    const design = await readDesign(page, STORE_KEY);
    for (const [k, v] of Object.entries(CUSTOM)) {
      expect(design?.[k], `campo ${k} após migração v2→v3`).toEqual(v);
    }
  });
});

/**
 * Preferências parciais guardadas antes da v3: a migração deve limitar-se a
 * preencher os campos em falta com os defaults, sem tocar no que o utilizador
 * já personalizou.
 */
test.describe("migração v3 com preferências parciais", () => {
  const PARCIAL = {
    modo: "dark",
    accent: "0.61 0.19 12",
    fonteTitulos: "Georgia, serif",
    janelasOpacidade: 0.55,
    raio: 0.3,
  } as const;

  test("preenche apenas os campos em falta e preserva os personalizados", async ({ page }) => {
    // Estado pré-v3 (version: 2) com apenas alguns campos de design.
    await page.addInitScript(
      ([key, parcial]) => {
        window.localStorage.setItem(
          key as string,
          JSON.stringify({
            state: { design: parcial, initialLanguageChosen: true, onboardingFeito: true },
            version: 2,
          }),
        );
      },
      [STORE_KEY, PARCIAL] as const,
    );

    await page.goto("/design");
    await page.waitForLoadState("networkidle");

    const design = (await readDesign(page, STORE_KEY)) as Record<string, unknown> | null;
    expect(design, "design migrado").toBeTruthy();

    // 1) Nada do que já existia foi sobrescrito.
    for (const [k, v] of Object.entries(PARCIAL)) {
      expect(design?.[k], `campo personalizado ${k} não deve mudar`).toEqual(v);
    }

    // 2) Os campos em falta foram preenchidos com valores de fábrica.
    const preenchidos = [
      "fonteTexto",
      "fonteMenu",
      "fonteAbas",
      "fonteCabecalho",
      "nomeNegocio",
      "fundoOpacidade",
      "botaoPrimarioOpacidade",
      "fontSizeBase",
    ];
    for (const k of preenchidos) {
      expect(design?.[k], `campo em falta ${k} deve ser preenchido`).not.toBeUndefined();
    }

    // 3) O DOM reflete a personalização preservada (modo escuro + raio).
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);
    const radius = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--radius").trim(),
    );
    expect(radius).toContain("0.3");

    // 4) Segundo arranque (migração já aplicada): continua estável.
    await page.reload();
    await page.waitForLoadState("networkidle");
    const depois = (await readDesign(page, STORE_KEY)) as Record<string, unknown> | null;
    for (const [k, v] of Object.entries(PARCIAL)) {
      expect(depois?.[k], `campo ${k} após reload`).toEqual(v);
    }
  });

  test("um design vazio pré-v3 recebe os defaults completos", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({ state: { design: {}, initialLanguageChosen: true, onboardingFeito: true }, version: 2 }),
      );
    }, STORE_KEY);

    await page.goto("/design");
    await page.waitForLoadState("networkidle");

    const design = (await readDesign(page, STORE_KEY)) as Record<string, unknown> | null;
    expect(design?.["modo"]).toBe("light");
    expect(design?.["fonteTitulos"]).toBeTruthy();
    expect(design?.["nomeNegocio"]).toBeTruthy();
  });
});
