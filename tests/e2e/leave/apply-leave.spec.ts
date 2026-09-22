import { test, expect } from "@core/fixtures/test-fixtures.js";
import { LeaveDateFactory } from "@core/data/TestDataFactory.js";

test.describe("Leave - Apply", () => {
  test("SCRUM-7: apply for leave creates a Pending Approval request", async ({
    applyLeavePage,
    myLeaveListPage,
  }) => {
    // "CAN - Personal" is the only leave type confirmed available to the Admin
    // account's own entitlement (Apply Leave's list is entitlement-limited,
    // unlike Assign Leave's full list — see docs in ApplyLeavePage). A unique
    // future date range per run keeps this self-isolating — the Admin
    // account is shared, so a fixed/default (today) date would collide
    // across repeated runs on the same day and read back a stale status.
    const { from, to } = LeaveDateFactory.buildFutureDateRange();
    await applyLeavePage.goto();
    await applyLeavePage.applyForLeave("CAN - Personal", from, to);

    await myLeaveListPage.goto();
    await myLeaveListPage.filterByDateRange(from, to);
    const row = myLeaveListPage.getRowByFromDate(from);
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Pending Approval");
  });
});
