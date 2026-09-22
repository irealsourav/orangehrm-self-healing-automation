import { test, expect } from "@core/fixtures/test-fixtures.js";

test.describe("My Info - Update Personal Details", () => {
  /** See tests/e2e/pim/edit-employee.spec.ts for why this asserts on the save confirmation rather than a reload round-trip. */
  test("SCRUM-13: update personal details is accepted and confirmed", async ({ personalDetailsPage }) => {
    // My Info routes to the exact same component as PIM's Personal Details
    // (confirmed live) — same Page Object, entered via gotoMyInfo() instead
    // of gotoForEmployee(empNumber).
    await personalDetailsPage.gotoMyInfo();
    await personalDetailsPage.setNationality("Canadian");
    expect(await personalDetailsPage.getNationalityValue()).toBe("Canadian");

    await personalDetailsPage.save();
    expect(await personalDetailsPage.getSaveConfirmationText()).toContain("Successfully Updated");
  });
});
