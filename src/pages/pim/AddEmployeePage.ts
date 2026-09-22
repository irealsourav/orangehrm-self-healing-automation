import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";

export class AddEmployeePage extends BasePage {
  protected readonly pageKey = "pim/addEmployee";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/pim/addEmployee", { waitUntil: "networkidle" });
  }

  async fillName(firstName: string, lastName: string): Promise<void> {
    await this.locator("firstNameInput").fill(this.page, firstName);
    await this.locator("lastNameInput").fill(this.page, lastName);
  }

  async save(): Promise<void> {
    await this.locator("saveButton").click(this.page);
    await this.page.waitForURL(/viewPersonalDetails/);
  }

  /** Convenience wrapper for the common case: fill mandatory fields, save, land on the new employee's Personal Details page. */
  async addEmployee(firstName: string, lastName: string): Promise<void> {
    await this.fillName(firstName, lastName);
    await this.save();
  }

  /** Attempts Save without filling any fields — used by the negative/validation Test Case. */
  async saveWithoutMandatoryFields(): Promise<void> {
    await this.locator("saveButton").click(this.page);
  }

  /**
   * Both First Name and Last Name show "Required" independently. (The
   * unstable 1-3 counts seen during development turned out to be a
   * selector bug, not a real timing race — see the locator's own
   * description for the full story. A short settle wait is still
   * reasonable since validation rendering isn't guaranteed instant.)
   */
  async getRequiredErrorCount(): Promise<number> {
    const errors = await this.locator("requiredFieldError").resolve(this.page);
    await this.page.waitForTimeout(500);
    return errors.count();
  }
}

PageFactory.register("pim/addEmployee", AddEmployeePage);
