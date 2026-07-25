import { test, expect } from "@playwright/test";

test("/auth never triggers translateBatch or 401", async ({ page }) => {
  const bad: string[] = [];
  page.on("response", (res) => {
    const url = res.url();
    if (res.status() === 401) bad.push(`401 ${url}`);
    if (url.includes("translateBatch")) bad.push(`translateBatch ${url}`);
  });
  await page.goto("/auth", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  expect(bad, `Unexpected calls: ${bad.join(", ")}`).toEqual([]);
});