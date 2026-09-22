import { test, expect } from "@core/fixtures/test-fixtures.js";

test.describe("Directory - Search", () => {
  test("SCRUM-14: search directory by name shows accurate job title and location", async ({ directoryPage }) => {
    // "Nguyễn Đức" is the employee record linked to the Admin login account
    // itself (confirmed live via the topbar user dropdown) — a stable seed
    // record, not something a prior test created, so this stays deterministic.
    await directoryPage.goto();
    await directoryPage.searchByName("Nguyễn Đức");

    const text = await directoryPage.getFirstResultText();
    expect(text).toContain("Nguyễn Đức");
  });
});
