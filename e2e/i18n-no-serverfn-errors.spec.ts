import { test, expect } from "@playwright/test";

// Verifies that navigating the app never triggers a translateBatch serverFn
// error (HTTP 400/500 or too_big Zod message).
test.describe("i18n / translateBatch", () => {
  test("no serverFn validation errors while browsing public routes", async ({ page }) => {
    const badRequests: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/_serverFn/") && res.status() >= 400) {
        badRequests.push(`${res.status()} ${res.url()}`);
      }
    });
    const badLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error" && (text.includes("too_big") || text.includes("String must contain"))) {
        badLogs.push(text);
      }
    });
    // Public surfaces that render long paragraphs (Quem Somos / Auth landing).
    for (const path of ["/quem-somos", "/auth"]) {
      await page.goto("http://localhost:8080" + path, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(1500);
    }
    expect(badRequests, "serverFn 4xx/5xx during navigation").toEqual([]);
    expect(badLogs, "translateBatch validation errors in console").toEqual([]);
  });
});