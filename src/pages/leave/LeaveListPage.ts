import type { Locator, Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdAutocomplete } from "@core/components/OxdAutocomplete.js";
import { OxdSelect } from "@core/components/OxdSelect.js";
import { OxdDateInput } from "@core/components/OxdDateInput.js";

export class LeaveListPage extends BasePage {
  protected readonly pageKey = "leave/leaveList";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/leave/viewLeaveList", { waitUntil: "networkidle" });
  }

  async filterByEmployeeName(name: string): Promise<void> {
    await new OxdAutocomplete(this.locator("employeeNameInput"), this.page).selectByText(name);
  }

  async filterByStatus(status: string): Promise<void> {
    await new OxdSelect(this.locator("showLeaveWithStatusDropdown"), this.page).selectOption(status);
  }

  /** See the locator JSON for why this exists — the default date window can exclude a far-future assigned leave. */
  async filterByDateRange(fromDate: string, toDate: string): Promise<void> {
    await new OxdDateInput(this.locator("fromDateInput"), this.page).setDate(fromDate);
    await new OxdDateInput(this.locator("toDateInput"), this.page).setDate(toDate);
  }

  async search(): Promise<void> {
    await this.locator("searchButton").click(this.page);
  }

  getResultRows(): Locator {
    return this.page.locator(".oxd-table-card");
  }

  async getResultCount(): Promise<number> {
    return this.getResultRows().count();
  }
}

PageFactory.register("leave/leaveList", LeaveListPage);
