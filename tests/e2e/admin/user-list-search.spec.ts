import { test, expect } from "@core/fixtures/test-fixtures.js";

test.describe("Admin - User List Search", () => {
  test("SCRUM-11: search/filter user list by username returns only matching results", async ({ userListPage }) => {
    await userListPage.goto();
    // "Admin" is the seeded default account — guaranteed to exist, no setup needed.
    await userListPage.searchByUsername("Admin");

    const rows = userListPage.getResultRows();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Admin");
  });
});
