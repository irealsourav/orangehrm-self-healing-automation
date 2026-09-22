import { test, expect } from "@core/fixtures/test-fixtures.js";

test.describe("Dashboard - Widgets", () => {
  test("SCRUM-12: core widgets render without errors", async ({ dashboardPage }) => {
    await dashboardPage.goto();
    expect(await dashboardPage.areCoreWidgetsVisible()).toBe(true);
  });
});
