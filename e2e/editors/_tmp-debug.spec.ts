import { test } from "@playwright/test";
import { openEditorTab } from "./_helpers";
test("debug paint", async ({ page }) => {
  await openEditorTab(page, /ponto cruz/i);
  const panel = page.locator('[role="tabpanel"][data-state="active"]');
  const cv = panel.locator("canvas").first();
  const box = (await cv.boundingBox())!;
  console.log("BOX", JSON.stringify(box));
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(600);
  const undos = panel.getByTitle(/Desfazer/i);
  console.log("UNDO count", await undos.count(), "disabled", await undos.first().isDisabled());
  const html = await undos.first().evaluate((e) => (e as HTMLElement).outerHTML);
  console.log("HTML", html.slice(0, 200));
  const cells = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("ponto-cruz-chart") || "{}")?.cells || {}).length);
  console.log("CELLS", cells);
});
