import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EmployeeDataFactory } from "@core/data/TestDataFactory.js";

test.describe("PIM - Add Employee", () => {
  test("SCRUM-5: add employee with mandatory fields only", async ({ page, addEmployeePage, employeeListPage }) => {
    const employee = EmployeeDataFactory.build();

    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    expect(page.url()).toContain("viewPersonalDetails");

    await employeeListPage.goto();
    await employeeListPage.searchByName(`${employee.firstName} ${employee.lastName}`);
    expect(await employeeListPage.getResultCount()).toBeGreaterThan(0);
  });

  test("SCRUM-21: add employee without mandatory fields shows validation error", async ({ addEmployeePage }) => {
    await addEmployeePage.goto();
    await addEmployeePage.saveWithoutMandatoryFields();

    expect(await addEmployeePage.getRequiredErrorCount()).toBe(2);
  });
});
