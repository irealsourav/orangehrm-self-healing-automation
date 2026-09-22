import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdSelect } from "@core/components/OxdSelect.js";
import { OxdDateInput } from "@core/components/OxdDateInput.js";

/**
 * Self-service leave application — applies to whoever is logged in. There is
 * no Employee Name field here (that's Assign Leave, a different page, for
 * Admin acting on an arbitrary employee).
 */
export class ApplyLeavePage extends BasePage {
  protected readonly pageKey = "leave/applyLeave";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/leave/applyLeave", { waitUntil: "networkidle" });
  }

  async selectLeaveType(leaveType: string): Promise<void> {
    await new OxdSelect(this.locator("leaveTypeDropdown"), this.page).selectOption(leaveType);
  }

  async setDateRange(fromDate: string, toDate: string): Promise<void> {
    await new OxdDateInput(this.locator("fromDateInput"), this.page).setDate(fromDate);
    await new OxdDateInput(this.locator("toDateInput"), this.page).setDate(toDate);
    // Same completion-race class as the dropdown/autocomplete widgets: the
    // form's internal validity state lags slightly behind the visual value.
    await this.page.waitForTimeout(300);
  }

  async apply(): Promise<void> {
    await this.locator("applyButton").click(this.page);
    // Wait for the confirmation toast rather than proceeding immediately —
    // acting on the result (e.g. navigating to check My Leave List) before
    // the submit actually completes reads stale state (same completion-race
    // class of bug found elsewhere in this app; see OxdAutocomplete).
    await this.page.locator(".oxd-toast").first().waitFor({ state: "visible", timeout: 10000 });
  }

  async applyForLeave(leaveType: string, fromDate: string, toDate: string): Promise<void> {
    await this.selectLeaveType(leaveType);
    await this.setDateRange(fromDate, toDate);
    await this.apply();
  }
}

PageFactory.register("leave/applyLeave", ApplyLeavePage);
