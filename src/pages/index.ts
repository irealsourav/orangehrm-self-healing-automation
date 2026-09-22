// Importing each Page Object module triggers its `PageFactory.register(...)`
// call. Tests import this barrel (indirectly, via fixtures) instead of
// importing individual Page Object classes, keeping PageFactory the single
// point of construction.
import "./auth/LoginPage.js";
import "./dashboard/DashboardPage.js";
import "./pim/AddEmployeePage.js";
import "./pim/EmployeeListPage.js";
import "./pim/PersonalDetailsPage.js";
import "./admin/AddUserPage.js";
import "./admin/UserListPage.js";
import "./leave/ApplyLeavePage.js";
import "./leave/AssignLeavePage.js";
import "./leave/LeaveListPage.js";
import "./leave/MyLeaveListPage.js";
import "./directory/DirectoryPage.js";
