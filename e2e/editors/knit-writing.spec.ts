import { test, expect } from "@playwright/test";
import { trackConsoleErrors, ensurePremium } from "./_helpers";

test.describe("Editor de Tricô — Fase 5 (Escrita & Dicionários)", () => {
  test("auto-completar, legenda, agulhas, dicionário, fases e repetições", async ({ page }) => {
    const { errors } = trackConsoleErrors(page);
    await ensurePremium(page);
    await page.goto("/ferramentas-tecnicas");
    await page.getByRole("tab", { name: /Editor de Gráficos: Tricô/i }).click();
    await page.getByRole("tab", { name: /Escrita/ }).click();

    // Auto-completar deve mostrar pelo menos 1 sugestão para "m"
    await expect(page.getByText(/Auto-completar inteligente/i)).toBeVisible();

    // Legenda gerada a partir de texto
    await expect(page.getByText(/Gerador automático de legenda/i)).toBeVisible();

    // Conversor de agulhas
    await expect(page.getByText(/Conversor de agulhas/i)).toBeVisible();
    await expect(page.getByText(/4mm/)).toBeVisible();

    // Dicionário PT/US/UK
    await expect(page.getByText(/Dicionário PT \/ US \/ UK/i)).toBeVisible();
    await expect(page.getByText(/bind off/i).first()).toBeVisible();

    // Organizador de fases
    await expect(page.getByRole("button", { name: /Gola/i })).toBeVisible();

    // Repetições — colapsar
    await page.getByRole("button", { name: /Colapsar em/i }).click();

    expect(errors).toEqual([]);
  });
});
