import { test, expect, devices } from "@playwright/test";

/**
 * Confirma que as variáveis do tema padrão (wallpaper, cor primária, raio
 * dos cartões, fonte de títulos) são idênticas em desktop e mobile ao
 * carregar a app numa conta nova (sem overrides guardados).
 */
const VARS = [
  "--primary",
  "--radius",
  "--font-display",
  "--app-bg-image",
  "--background",
  "--sidebar",
] as const;

async function readVars(page: import("@playwright/test").Page) {
  return page.evaluate((names) => {
    const cs = getComputedStyle(document.documentElement);
    const out: Record<string, string> = {};
    for (const n of names) out[n] = cs.getPropertyValue(n).trim();
    return out;
  }, VARS as unknown as string[]);
}

test("tema padrão coincide entre desktop e mobile", async ({ browser }) => {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto("/", { waitUntil: "networkidle" });
  await dPage.waitForTimeout(500);
  const desktopVars = await readVars(dPage);
  await desktop.close();

  const mobile = await browser.newContext({ ...devices["Pixel 7"] });
  const mPage = await mobile.newPage();
  await mPage.goto("/", { waitUntil: "networkidle" });
  await mPage.waitForTimeout(500);
  const mobileVars = await readVars(mPage);
  await mobile.close();

  expect(mobileVars).toEqual(desktopVars);
});