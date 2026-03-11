import { defineConfig } from "@playwright/test";

const port = Number(process.env.TAVERN_ACCEPTANCE_PORT ?? 3110);
const databaseTestUrl = process.env.DATABASE_TEST_URL;

if (!databaseTestUrl) {
  throw new Error(
    "DATABASE_TEST_URL is required for Tavern acceptance tests.",
  );
}

export default defineConfig({
  testDir: "./tests/acceptance",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/acceptance/global-setup.ts",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm -F @dnd/app build && pnpm -F @dnd/app start",
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    env: {
      PORT: String(port),
      DATABASE_URL: databaseTestUrl,
      DATABASE_PUBLIC_URL: databaseTestUrl,
    },
  },
});
