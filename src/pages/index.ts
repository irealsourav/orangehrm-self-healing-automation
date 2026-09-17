// Importing each Page Object module triggers its `PageFactory.register(...)`
// call. Tests import this barrel (indirectly, via fixtures) instead of
// importing individual Page Object classes, keeping PageFactory the single
// point of construction.
//
// One line per module. At scale, split this into per-module barrels
// (src/pages/auth/index.ts, src/pages/pim/index.ts, ...) re-exported here,
// so a change inside one module never touches this file.
import "./auth/LoginPage.js";
import "./dashboard/DashboardPage.js";
