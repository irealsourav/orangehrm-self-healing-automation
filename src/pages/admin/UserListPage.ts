import type { Locator, Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";

export class UserListPage extends BasePage {
  protected readonly pageKey = "admin/userList";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/admin/viewSystemUsers", { waitUntil: "networkidle" });
  }

  async searchByUsername(username: string): Promise<void> {
    await this.locator("usernameInput").fill(this.page, username);
    await this.locator("searchButton").click(this.page);
  }

  getResultRows(): Locator {
    return this.page.locator(".oxd-table-card");
  }

  async getResultCount(): Promise<number> {
    return this.getResultRows().count();
  }
}

PageFactory.register("admin/userList", UserListPage);
