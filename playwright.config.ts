import { defineConfig, devices } from "@playwright/test";
import { EnvConfig } from "@config/env.js";
import { ADMIN_AUTH_FILE } from "@config/authState.js";

const env = EnvConfig.getInstance();

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // workers: 1 is a deliberate, evidence-based choice, not a conservative
  // default. Confirmed by direct A/B testing: at workers: 2, tests that are
  // rock solid in isolation (e.g. Add Employee's save+redirect) started
  // failing purely from two workers calling it around the same time — the
  // shared PUBLIC demo instance (not infrastructure we control) appears to
  // genuinely degrade under concurrent writes to the same endpoints, not
  // just "be slower." Retries absorb the occasional remaining transient
  // blip; the same reasoning applies to `parallel:` in .gitlab-ci.yml.
  // Revisit both once/if tests run against a self-hosted instance (Stage B
  // in docs/LOCATOR_LIFECYCLE.md) instead of the public demo.
  retries: 1,
  workers: 1,
  // Default (30s) proved too tight for a public demo under real load —
  // several genuinely-passing flows (e.g. Add Employee's save+redirect)
  // were observed exceeding it, not because anything was broken but
  // because the shared instance was briefly slow. 45s gives real slowness
  // room to resolve without masking an actually-hung interaction.
  timeout: 45000,
  // In CI, each shard writes a "blob" report (mergeable into one HTML report
  // afterward, see the `merge-report` CI job) instead of its own HTML report.
  // JUnit is still per-shard: GitLab combines JUnit results from every job
  // in a pipeline into one test summary automatically.
  reporter: process.env.CI
    ? [["blob"], ["junit", { outputFile: "test-results/junit.xml" }], ["list"]]
    : [
        ["html", { open: "never" }],
        ["json", { outputFile: "test-results/results.json" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
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
