import { mkdirSync } from "node:fs";
import path from "node:path";
import { test as setup, expect } from "@core/fixtures/test-fixtures.js";
import { EnvConfig } from "@config/env.js";
import { ADMIN_AUTH_FILE } from "@config/authState.js";

const env = EnvConfig.getInstance();

/**
 * Runs once before the main test project (see the `dependencies` wiring in
 * playwright.config.ts), logs in exactly one time, and persists cookies +
 * localStorage to disk. Every other test then starts already authenticated
 * by loading this file as its `storageState` — at 10,000 tests, that's the
 * difference between one login and ten thousand.
 */
setup("authenticate as Admin", async ({ page, loginPage, dashboardPage }) => {
  mkdirSync(path.dirname(ADMIN_AUTH_FILE), { recursive: true });

  await loginPage.goto();
  await loginPage.login(env.adminUsername, env.adminPassword);
  // Explicit timeout: isLoaded() polls a self-healing locator whose own
  // primary-candidate wait can take up to 10s, which is longer than
  // expect.poll's 5s default — without this, the outer poll can time out
  // before the inner check even completes one attempt.
  await expect.poll(() => dashboardPage.isLoaded(), { timeout: 20000 }).toBeTruthy();

  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
