import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EmployeeDataFactory, UserAccountDataFactory, LeaveDateFactory } from "@core/data/TestDataFactory.js";

test.describe("[E2E] New Hire Onboarding Journey", () => {
  test("SCRUM-19: one employee stays consistent across PIM, Admin, and Leave", async ({
    addEmployeePage,
    employeeListPage,
    addUserPage,
    assignLeavePage,
    leaveListPage,
  }) => {
    const employee = EmployeeDataFactory.build();
    const account = UserAccountDataFactory.build();
    const { from, to } = LeaveDateFactory.buildFutureDateRange();

    // Step 1: PIM — add the employee.
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    // Step 2: verify visible in the Employee List.
    await employeeListPage.goto();
    await employeeListPage.searchByName(`${employee.firstName} ${employee.lastName}`);
    await expect(employeeListPage.getResultRows()).toHaveCount(1);

    // Step 3: Admin — link a system user (ESS, Enabled).
    await addUserPage.goto();
    await addUserPage.selectUserRole("ESS");
    await addUserPage.selectEmployeeByName(employee.firstName);
    await addUserPage.selectStatus("Enabled");
    await addUserPage.fillCredentials(account.username, account.password);
    await addUserPage.save();

    // Step 4: Leave — assign leave to this specific employee.
    await assignLeavePage.goto();
    await assignLeavePage.assignLeave(employee.firstName, "CAN - Vacation", from, to);

    // Step 5: verify the leave record is attributed to the same employee.
    // Widen the date window first — confirmed live it defaults narrow
    // enough to exclude a LeaveDateFactory-generated far-future date.
    await leaveListPage.goto();
    await leaveListPage.filterByDateRange(from, to);
    await leaveListPage.filterByEmployeeName(employee.firstName);
    await leaveListPage.search();
    const rows = leaveListPage.getResultRows();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(employee.firstName);
  });
});
