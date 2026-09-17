import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";

export class DashboardPage extends BasePage {
  protected readonly pageKey = "dashboard/overview";

  constructor(page: Page) {
    super(page);
  }

  async getBreadcrumbTitle(): Promise<string | null> {
    return this.locator("breadcrumbTitle").textContent(this.page);
  }

  async isLoaded(): Promise<boolean> {
    return this.locator("breadcrumbTitle").isVisible(this.page);
  }
}

PageFactory.register("dashboard/overview", DashboardPage);
