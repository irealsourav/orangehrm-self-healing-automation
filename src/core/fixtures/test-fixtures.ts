import { test as base } from "@playwright/test";
import "@pages/index.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { LoginPage } from "@pages/auth/LoginPage.js";
import { DashboardPage } from "@pages/dashboard/DashboardPage.js";
import { AddEmployeePage } from "@pages/pim/AddEmployeePage.js";
import { EmployeeListPage } from "@pages/pim/EmployeeListPage.js";
import { PersonalDetailsPage } from "@pages/pim/PersonalDetailsPage.js";
import { AddUserPage } from "@pages/admin/AddUserPage.js";
import { UserListPage } from "@pages/admin/UserListPage.js";
import { ApplyLeavePage } from "@pages/leave/ApplyLeavePage.js";
import { AssignLeavePage } from "@pages/leave/AssignLeavePage.js";
import { LeaveListPage } from "@pages/leave/LeaveListPage.js";
import { MyLeaveListPage } from "@pages/leave/MyLeaveListPage.js";
import { DirectoryPage } from "@pages/directory/DirectoryPage.js";

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  addEmployeePage: AddEmployeePage;
  employeeListPage: EmployeeListPage;
  personalDetailsPage: PersonalDetailsPage;
  addUserPage: AddUserPage;
  userListPage: UserListPage;
  applyLeavePage: ApplyLeavePage;
  assignLeavePage: AssignLeavePage;
  leaveListPage: LeaveListPage;
  myLeaveListPage: MyLeaveListPage;
  directoryPage: DirectoryPage;
}

/**
 * Extends Playwright's base test with ready-to-use Page Objects, built
 * through PageFactory so test files never call `new SomePage(page)` directly.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(PageFactory.create<LoginPage>("auth/login", page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(PageFactory.create<DashboardPage>("dashboard/overview", page));
  },
  addEmployeePage: async ({ page }, use) => {
    await use(PageFactory.create<AddEmployeePage>("pim/addEmployee", page));
  },
  employeeListPage: async ({ page }, use) => {
    await use(PageFactory.create<EmployeeListPage>("pim/employeeList", page));
  },
  personalDetailsPage: async ({ page }, use) => {
    await use(PageFactory.create<PersonalDetailsPage>("pim/personalDetails", page));
  },
  addUserPage: async ({ page }, use) => {
    await use(PageFactory.create<AddUserPage>("admin/addUser", page));
  },
  userListPage: async ({ page }, use) => {
    await use(PageFactory.create<UserListPage>("admin/userList", page));
  },
  applyLeavePage: async ({ page }, use) => {
    await use(PageFactory.create<ApplyLeavePage>("leave/applyLeave", page));
  },
  assignLeavePage: async ({ page }, use) => {
    await use(PageFactory.create<AssignLeavePage>("leave/assignLeave", page));
  },
  leaveListPage: async ({ page }, use) => {
    await use(PageFactory.create<LeaveListPage>("leave/leaveList", page));
  },
  myLeaveListPage: async ({ page }, use) => {
    await use(PageFactory.create<MyLeaveListPage>("leave/myLeaveList", page));
  },
  directoryPage: async ({ page }, use) => {
    await use(PageFactory.create<DirectoryPage>("directory/directory", page));
  },
});

export { expect } from "@playwright/test";
