import type { Locator, Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdDateInput } from "@core/components/OxdDateInput.js";

/** Self-service "My Leave" list — distinct from the admin LeaveListPage (different URL, no employee filter, shows only the logged-in user's own requests). */
export class MyLeaveListPage extends BasePage {
  protected readonly pageKey = "leave/myLeaveList";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/leave/viewMyLeaveList", { waitUntil: "networkidle" });
  }

  /**
   * This page defaults to a narrow date window that can exclude a
   * LeaveDateFactory-generated far-future date (confirmed live). Widen it
   * to bracket the date this test actually used before searching.
   */
  async filterByDateRange(fromDate: string, toDate: string): Promise<void> {
    await new OxdDateInput(this.locator("fromDateInput"), this.page).setDate(fromDate);
    await new OxdDateInput(this.locator("toDateInput"), this.page).setDate(toDate);
    await this.locator("searchButton").click(this.page);
  }

  getResultRows(): Locator {
    return this.page.locator(".oxd-table-card");
  }

  async getLatestRowText(): Promise<string> {
    return this.getResultRows().first().innerText();
  }

  /**
   * Sort order here isn't documented/guaranteed, and with a random future
   * date per test run (see LeaveDateFactory) "the first row" isn't reliably
   * "the one this test just created." Filter by the date this test used
   * instead of assuming position, so the status check is scoped to the
   * right row, not just "this text appears somewhere on the page."
   */
  getRowByFromDate(fromDate: string): Locator {
    return this.getResultRows().filter({ hasText: fromDate });
  }
}

PageFactory.register("leave/myLeaveList", MyLeaveListPage);
