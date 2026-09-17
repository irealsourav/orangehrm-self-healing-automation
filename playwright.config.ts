import { defineConfig, devices } from "@playwright/test";
import { EnvConfig } from "@config/env.js";
import { ADMIN_AUTH_FILE } from "@config/authState.js";

const env = EnvConfig.getInstance();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["list"],
  ],
  use: {
    baseURL: env.baseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Runs first: logs in once, saves the session to disk. See tests/setup/auth.setup.ts.
    { name: "setup", testMatch: /.*\.setup\.ts/ },

    // Auth-flow tests need a *fresh, unauthenticated* browser context by definition,
    // so they deliberately don't load the saved session and don't depend on "setup".
    {
      name: "chromium-unauthenticated",
      testMatch: /auth\/login\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Every other test starts already logged in via storageState, skipping the
    // UI login entirely — the main performance lever at large test-suite scale.
    {
      name: "chromium",
      testIgnore: /auth\/login\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: ADMIN_AUTH_FILE },
      dependencies: ["setup"],
    },
  ],
});
