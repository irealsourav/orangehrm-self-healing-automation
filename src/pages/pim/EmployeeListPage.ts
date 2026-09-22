import type { Locator, Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdAutocomplete } from "@core/components/OxdAutocomplete.js";

export class EmployeeListPage extends BasePage {
  protected readonly pageKey = "pim/employeeList";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/pim/viewEmployeeList", { waitUntil: "networkidle" });
  }

  async searchByName(name: string): Promise<void> {
    const autocomplete = new OxdAutocomplete(this.locator("employeeNameInput"), this.page);
    await autocomplete.selectByText(name);
    await this.locator("searchButton").click(this.page);
  }

  /** Row-list access is structural (how many/which rows), not a single dynamic element — bypasses the self-healing wrapper by design. */
  getResultRows(): Locator {
    return this.page.locator(".oxd-table-card");
  }

  async getResultCount(): Promise<number> {
    return this.getResultRows().count();
  }
}

PageFactory.register("pim/employeeList", EmployeeListPage);
