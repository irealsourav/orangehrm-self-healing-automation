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

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/dashboard/index", { waitUntil: "networkidle" });
  }

  async areCoreWidgetsVisible(): Promise<boolean> {
    const [timeAtWork, myActions, quickLaunch] = await Promise.all([
      this.locator("timeAtWorkWidget").isVisible(this.page),
      this.locator("myActionsWidget").isVisible(this.page),
      this.locator("quickLaunchWidget").isVisible(this.page),
    ]);
    return timeAtWork && myActions && quickLaunch;
  }
}

PageFactory.register("dashboard/overview", DashboardPage);
