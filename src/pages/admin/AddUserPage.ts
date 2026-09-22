import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdSelect } from "@core/components/OxdSelect.js";
import { OxdAutocomplete } from "@core/components/OxdAutocomplete.js";

export class AddUserPage extends BasePage {
  protected readonly pageKey = "admin/addUser";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/admin/saveSystemUser", { waitUntil: "networkidle" });
  }

  async selectUserRole(role: "Admin" | "ESS"): Promise<void> {
    await new OxdSelect(this.locator("userRoleDropdown"), this.page).selectOption(role);
  }

  async selectStatus(status: "Enabled" | "Disabled"): Promise<void> {
    await new OxdSelect(this.locator("statusDropdown"), this.page).selectOption(status);
  }

  async selectEmployeeByName(searchText: string): Promise<void> {
    await new OxdAutocomplete(this.locator("employeeNameInput"), this.page).selectByText(searchText);
  }

  async fillCredentials(username: string, password: string, confirmPassword: string = password): Promise<void> {
    await this.locator("usernameInput").fill(this.page, username);
    await this.locator("passwordInput").fill(this.page, password);
    await this.locator("confirmPasswordInput").fill(this.page, confirmPassword);
  }

  async save(): Promise<void> {
    await this.locator("saveButton").click(this.page);
  }

  async getUsernameAlreadyExistsError(): Promise<string | null> {
    return this.locator("usernameAlreadyExistsError").textContent(this.page);
  }

  async getPasswordMismatchError(): Promise<string | null> {
    return this.locator("passwordMismatchError").textContent(this.page);
  }
}

PageFactory.register("admin/addUser", AddUserPage);
