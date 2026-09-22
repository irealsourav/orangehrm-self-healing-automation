import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EmployeeDataFactory } from "@core/data/TestDataFactory.js";

test.describe("PIM - Employee List Search", () => {
  test("SCRUM-6: search employee list by name returns only matching results", async ({
    addEmployeePage,
    employeeListPage,
  }) => {
    const employee = EmployeeDataFactory.build();
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    await employeeListPage.goto();
    await employeeListPage.searchByName(`${employee.firstName} ${employee.lastName}`);

    const rows = employeeListPage.getResultRows();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText(employee.firstName);
    await expect(rows.first()).toContainText(employee.lastName);
  });
});
