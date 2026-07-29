import { test, expect } from "@playwright/test";
import { trackConsoleErrors, ensurePremium } from "./_helpers";

test.describe("Editor de Tricô — Fase 6 (Testadores & UX)", () => {
  test("contador persiste, atalhos, notas por carreira e link público", async ({ page, context }) => {
    const { errors } = trackConsoleErrors(page);
    await ensurePremium(page);
    await page.goto("/ferramentas-tecnicas");
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await page.getByRole("tab", { name: /Testadores/i }).click();

    const panel = page.getByTestId("knit-tester");
    await expect(panel).toBeVisible();

    // Estado inicial: carreira 1.
    await expect(page.getByTestId("knit-tester-atual")).toHaveText("1");

    // Botão avança.
    await page.getByTestId("knit-tester-next").click();
    await expect(page.getByTestId("knit-tester-atual")).toHaveText("2");

    // Atalho teclado avança de novo.
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("knit-tester-atual")).toHaveText("3");

    // Nota é gravada.
    await page.getByPlaceholder(/Nota para C/).fill("erro na diminuição");
    await page.getByTestId("knit-tester-add-note").click();
    await expect(page.getByTestId("knit-tester-notes")).toContainText("erro na diminuição");

    // Progresso persiste após reload.
    await page.reload();
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await page.getByRole("tab", { name: /Testadores/i }).click();
    await expect(page.getByTestId("knit-tester-atual")).toHaveText("3");

    // Link público — permite ao browser copiar sem prompt.
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: /Copiar link público/i }).click();
    // A cópia é assíncrona (gera o pacote antes de escrever no clipboard):
    // aguarda até o clipboard conter o link em vez de ler uma única vez.
    await expect
      .poll(async () => page.evaluate(() => navigator.clipboard.readText()), { timeout: 20_000 })
      .toMatch(/\/receita-tester-tricot\/.*#pkg=/s);
    const url: string = await page.evaluate(() => navigator.clipboard.readText());

    // A página pública abre com o pacote e mostra o contador.
    await page.goto(url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(page.getByTestId("knit-tester-page")).toBeVisible();
    await expect(page.getByTestId("knit-tester-atual")).toBeVisible();

    expect(errors).toEqual([]);
  });
});