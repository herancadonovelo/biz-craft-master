import { test, expect } from "@playwright/test";

test("/auth mostra banner de sessão expirada e não dispara 401", async ({ page }) => {
  const bad: string[] = [];
  page.on("response", (res) => {
    if (res.status() === 401) bad.push(`401 ${res.url()}`);
  });
  await page.goto("/auth?expired=1", { waitUntil: "networkidle" });
  await expect(page.getByText(/sessão expirou|foi encerrada/i)).toBeVisible();
  expect(bad, `Requests 401 inesperados: ${bad.join(", ")}`).toEqual([]);
});