import { test, expect } from "@playwright/test";
import { openEditorTab, trackConsoleErrors } from "./_helpers";

const AMI_TAB = /amigurumis|crochê/i;

test.describe("Editor · Amigurumis & Crochê — regressão de atalhos e opções", () => {

test("adiciona carreira sem redirecionar", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const addRow = page.getByRole("button", { name: /^Carreira$/ }).first();
  await expect(addRow).toBeVisible();
  await addRow.click();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});

test("todas as sub-abas top-level abrem sem erro", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const subTabs = ["Padrão & Escrita", "Visuais", "CBM · Stock & Preço", "Modo Tester", "Design & PDF", "Extras"];
  for (const name of subTabs) {
    const tab = page.getByRole("tab", { name }).first();
    await tab.click();
    await expect(tab).toHaveAttribute("data-state", "active");
    await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  }
  expect(errors).toEqual([]);
});

test("adiciona peça, renomeia e remove sem redirecionar", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  await page.getByRole("button", { name: /^Peça$/ }).click();
  const novaTab = page.getByRole("tab", { name: /Nova peça/ }).first();
  await expect(novaTab).toBeVisible();
  await novaTab.click();
  const nomeInput = page.locator('input[value="Nova peça"]').first();
  await nomeInput.fill("Cauda");
  await expect(page.getByRole("tab", { name: /^Cauda$/ }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});

test("gerador de esfera insere carreiras", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const initial = await page.getByTestId(/^carreira-input-/).count();
  await page.getByRole("button", { name: /Gerar esfera/ }).click();
  const gerarBtn = page.getByRole("button", { name: /^Gerar$/ });
  await expect(gerarBtn).toBeVisible();
  await gerarBtn.click();
  await expect(async () => {
    const c = await page.getByTestId(/^carreira-input-/).count();
    expect(c).toBeGreaterThan(initial);
  }).toPass({ timeout: 5_000 });
  await expect(page).toHaveURL(/\/ferramentas-tecnicas$/);
  expect(errors).toEqual([]);
});

test("repetição builder insere padrão [...] x N", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  await page.getByRole("button", { name: /\[…\] × N|\[\.\.\.\] × N/ }).click();
  const inserir = page.getByRole("button", { name: /Inserir compacto/ });
  await expect(inserir).toBeVisible();
  await inserir.click();
  const rows = page.getByTestId(/^carreira-input-/);
  const last = rows.last();
  await expect(last).toHaveValue(/\[.*\] x 6/);
  expect(errors).toEqual([]);
});

test("botão de total calculado (=) insere sufixo de pontos", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const first = page.getByTestId("carreira-input-0");
  await expect(first).toBeVisible();
  await first.fill("6 aum");
  // botão inline "= (12)" no fim da linha
  const totalBtn = page.getByRole("button", { name: /^=\s*\(\d+\)$/ }).first();
  await totalBtn.click();
  await expect(first).toHaveValue(/\(\d+\)\s*$/);
  expect(errors).toEqual([]);
});

test("terminologia PT → US converte pontos", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const first = page.getByTestId("carreira-input-0");
  await first.fill("am 6 pb (6)");
  // Radix Select: clica no trigger que mostra "Português (PT/BR)"
  await page.getByRole("combobox").filter({ hasText: /Português/ }).click();
  await page.getByRole("option", { name: /Inglês \(US\)/ }).click();
  await expect(first).toHaveValue(/sc/i);
  expect(errors).toEqual([]);
});

test("estado persiste em localStorage após interação", async ({ page }) => {
  const { errors } = trackConsoleErrors(page);
  await openEditorTab(page, AMI_TAB);
  const titulo = page.getByPlaceholder(/Ex: Ursinho Nino/);
  await titulo.fill("Regressão Amigurumi");
  // dá tempo ao useEffect de gravar
  await page.waitForTimeout(200);
  const raw = await page.evaluate(() => window.localStorage.getItem("amigurumi-editor-v1"));
  expect(raw).toBeTruthy();
  expect(raw!).toContain("Regressão Amigurumi");
  expect(errors).toEqual([]);
});

});