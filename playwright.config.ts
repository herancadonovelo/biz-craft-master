import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 8080);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const CHROMIUM_EXECUTABLE = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  ?? (existsSync("/bin/chromium") ? "/bin/chromium" : undefined);

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  // The dev server is a single Vite process shared by every worker; more than
  // two parallel files starves it and turns slow first paints into timeouts
  // that only reproduce under full-suite load.
  workers: Number(process.env.PLAYWRIGHT_WORKERS ?? 2),
  // Controlled retry policy: local runs stay strict (0 retries) to surface
  // flakes immediately; CI retries twice to absorb transient network hiccups
  // while still flagging repeat failures in the JSON summary.
  retries: process.env.CI ? 2 : Number(process.env.PLAYWRIGHT_RETRIES ?? 1),
  reporter: process.env.CI
    ? [
        ["list"],
        ["json", { outputFile: "playwright-report/results.json" }],
        ["html", { outputFolder: "playwright-report/html", open: "never" }],
        ["github"],
      ]
    : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
    screenshot: process.env.CI ? "only-on-failure" : "off",
    viewport: { width: 1280, height: 800 },
    launchOptions: CHROMIUM_EXECUTABLE ? { executablePath: CHROMIUM_EXECUTABLE } : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // In CI a fresh dev server is started; locally we reuse whatever is already
  // running on PORT (bun run dev). Setting PLAYWRIGHT_SKIP_WEBSERVER=1 opts out.
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "bun run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});