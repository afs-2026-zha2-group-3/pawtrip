import { defineConfig, devices } from "@playwright/test";

const useSystemChrome = process.env.PAWTRIP_USE_SYSTEM_CHROME === "true";

// 每个 worker 使用独立的 petowner-wN 账号，上限需与 scripts/run-e2e.mjs 的种子数量一致。
const maxWorkers = 8;
const requestedWorkers = Number(
  process.env.PAWTRIP_E2E_WORKERS ?? (process.env.CI ? 2 : 4),
);
const workers = Math.min(
  Number.isInteger(requestedWorkers) && requestedWorkers > 0
    ? requestedWorkers
    : 1,
  maxWorkers,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  outputDir: "test-results",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: useSystemChrome ? "chrome" : "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(useSystemChrome ? { channel: "chrome" as const } : {}),
      },
    },
  ],
});
