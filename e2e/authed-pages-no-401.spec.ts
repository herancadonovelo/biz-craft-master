import { test, expect } from "@playwright/test";

const PAGES = ["/encomendas", "/stock", "/faturacao", "/assistente"];

for (const page of PAGES) {
  test(`${page} não dispara chamadas autenticadas sem sessão`, async ({ page: p }) => {
    const bad: string[] = [];
    p.on("response", (res) => {
      const url = res.url();
      if (res.status() === 401) bad.push(`401 ${url}`);
      if (url.includes("/_serverFn/") && res.status() >= 400)
        bad.push(`${res.status()} ${url}`);
      if (url.includes("translateBatch")) bad.push(`translateBatch ${url}`);
    });
    await p.goto(page, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    expect(bad, `Server fn calls sem sessão em ${page}: ${bad.join(", ")}`).toEqual([]);
  });
}