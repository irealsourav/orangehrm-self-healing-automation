import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EnvConfig } from "@config/env.js";

const env = EnvConfig.getInstance();

test.describe("OrangeHRM Login", () => {
  test("valid credentials land on the Dashboard", async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(env.adminUsername, env.adminPassword);

    await expect.poll(() => dashboardPage.isLoaded()).toBeTruthy();
    expect(await dashboardPage.getBreadcrumbTitle()).toBe("Dashboard");
  });

  test("invalid credentials show an error and stay on the login page", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login("wronguser", "wrongpass");

    expect(await loginPage.getErrorMessage()).toContain("Invalid credentials");
    expect(page.url()).toContain("/auth/login");
  });
});
