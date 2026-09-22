import { test, expect } from "@core/fixtures/test-fixtures.js";
import { EmployeeDataFactory, UserAccountDataFactory } from "@core/data/TestDataFactory.js";

test.describe("Admin - Add User", () => {
  test("SCRUM-8: add system user linked to an employee", async ({
    addEmployeePage,
    addUserPage,
    userListPage,
  }) => {
    const employee = EmployeeDataFactory.build();
    const account = UserAccountDataFactory.build();

    // Precondition: an employee with no linked user account exists.
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    await addUserPage.goto();
    await addUserPage.selectUserRole("ESS");
    await addUserPage.selectEmployeeByName(employee.firstName);
    await addUserPage.selectStatus("Enabled");
    await addUserPage.fillCredentials(account.username, account.password);
    await addUserPage.save();

    await userListPage.goto();
    await userListPage.searchByUsername(account.username);
    expect(await userListPage.getResultCount()).toBe(1);
  });

  test("SCRUM-22: add system user with duplicate username shows validation error", async ({
    addEmployeePage,
    addUserPage,
  }) => {
    const employee = EmployeeDataFactory.build();
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    await addUserPage.goto();
    await addUserPage.selectUserRole("Admin");
    await addUserPage.selectEmployeeByName(employee.firstName);
    await addUserPage.selectStatus("Enabled");
    // "Admin" is the seeded default account username — always exists, no setup needed.
    await addUserPage.fillCredentials("Admin", "Password123!");
    await addUserPage.save();

    expect(await addUserPage.getUsernameAlreadyExistsError()).toContain("Already exists");
  });

  test("SCRUM-23: add system user with mismatched passwords shows validation error", async ({
    addEmployeePage,
    addUserPage,
  }) => {
    const employee = EmployeeDataFactory.build();
    const account = UserAccountDataFactory.build();
    await addEmployeePage.goto();
    await addEmployeePage.addEmployee(employee.firstName, employee.lastName);

    await addUserPage.goto();
    await addUserPage.selectUserRole("ESS");
    await addUserPage.selectEmployeeByName(employee.firstName);
    await addUserPage.selectStatus("Enabled");
    await addUserPage.fillCredentials(account.username, account.password, "DifferentPassword456!");
    await addUserPage.save();

    expect(await addUserPage.getPasswordMismatchError()).toContain("Passwords do not match");
  });
});
