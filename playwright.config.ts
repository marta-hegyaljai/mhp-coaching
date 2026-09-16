import {config as loadEnv} from "dotenv";
import {defineConfig, devices} from "@playwright/test";

// Same local env files the app reads, so E2E_* credentials never have to be
// typed on a command line.
loadEnv({path: [".env.local", ".env"], quiet: true});

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {name: "setup", testMatch: /.*\.setup\.ts/},
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `${baseURL}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
