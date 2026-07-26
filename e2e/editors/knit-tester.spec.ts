import { test, expect } from "@playwright/test";
import { trackConsoleErrors } from "./_helpers";

test.describe("Editor de Tricô — Fase 6 (Testadores & UX)", () => {
  test("contador persiste, atalhos, notas por carreira e link público", async ({ page, context }) => {
    const { errors } = trackConsoleErrors(page);
    await page.goto("/ferramentas-tecnicas");
    if (await page.getByText(/Premium|Desbloquear/i).first().isVisible().catch(() => false)) {
      test.skip(true, "premium-gated");
    }
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
    const url: string = await page.evaluate(() => navigator.clipboard.readText());
    expect(url).toContain("/receita-tester-tricot/");
    expect(url).toMatch(/#pkg=/);

    // A página pública abre com o pacote e mostra o contador.
    await page.goto(url.replace(/^https?:\/\/[^/]+/, ""));
    await expect(page.getByTestId("knit-tester-page")).toBeVisible();
    await expect(page.getByTestId("knit-tester-atual")).toBeVisible();

    expect(errors).toEqual([]);
  });
});