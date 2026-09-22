import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdSelect } from "@core/components/OxdSelect.js";
import { OxdAutocomplete } from "@core/components/OxdAutocomplete.js";
import { OxdDateInput } from "@core/components/OxdDateInput.js";

/** Admin assigning leave to an arbitrary employee — the correct page for cross-employee flows (see docs in ApplyLeavePage for why Apply is wrong for that case). */
export class AssignLeavePage extends BasePage {
  protected readonly pageKey = "leave/assignLeave";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/leave/assignLeave", { waitUntil: "networkidle" });
  }

  async selectEmployeeByName(searchText: string): Promise<void> {
    await new OxdAutocomplete(this.locator("employeeNameInput"), this.page).selectByText(searchText);
  }

  async selectLeaveType(leaveType: string): Promise<void> {
    await new OxdSelect(this.locator("leaveTypeDropdown"), this.page).selectOption(leaveType);
  }

  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    await new OxdDateInput(this.locator("fromDateInput"), this.page).setDate(fromDate);
    await new OxdDateInput(this.locator("toDateInput"), this.page).setDate(toDate);
    // See ApplyLeavePage.setDateRange for why this settle wait is here.
    await this.page.waitForTimeout(300);
  }

  async assign(): Promise<void> {
    await this.locator("assignButton").click(this.page);
    // See ApplyLeavePage.apply() for why this waits on the confirmation toast.
    await this.page.locator(".oxd-toast").first().waitFor({ state: "visible", timeout: 10000 });
  }

  async assignLeave(
    employeeSearchText: string,
    leaveType: string,
    fromDate: string,
    toDate: string,
  ): Promise<void> {
    await this.selectEmployeeByName(employeeSearchText);
    await this.selectLeaveType(leaveType);
    await this.setDateRange(fromDate, toDate);
    await this.assign();
  }
}

PageFactory.register("leave/assignLeave", AssignLeavePage);
