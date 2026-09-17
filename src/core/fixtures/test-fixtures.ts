import { test as base } from "@playwright/test";
import "@pages/index.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { LoginPage } from "@pages/auth/LoginPage.js";
import { DashboardPage } from "@pages/dashboard/DashboardPage.js";

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
}

/**
 * Extends Playwright's base test with ready-to-use Page Objects, built
 * through PageFactory so test files never call `new SomePage(page)` directly.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(PageFactory.create<LoginPage>("auth/login", page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(PageFactory.create<DashboardPage>("dashboard/overview", page));
  },
});

export { expect } from "@playwright/test";
