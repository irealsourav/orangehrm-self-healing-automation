import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";

export class LoginPage extends BasePage {
  protected readonly pageKey = "auth/login";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/auth/login");
  }

  async login(username: string, password: string): Promise<void> {
    await this.locator("usernameInput").fill(this.page, username);
    await this.locator("passwordInput").fill(this.page, password);
    await this.locator("loginButton").click(this.page);
  }

  async getErrorMessage(): Promise<string | null> {
    return this.locator("errorAlert").textContent(this.page);
  }
}

PageFactory.register("auth/login", LoginPage);
