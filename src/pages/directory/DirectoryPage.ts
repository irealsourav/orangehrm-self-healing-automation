import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";
import { OxdAutocomplete } from "@core/components/OxdAutocomplete.js";

export class DirectoryPage extends BasePage {
  protected readonly pageKey = "directory/directory";

  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.page.goto("/web/index.php/directory/viewDirectory", { waitUntil: "networkidle" });
  }

  async searchByName(name: string): Promise<void> {
    await new OxdAutocomplete(this.locator("employeeNameInput"), this.page).selectByText(name);
    await this.locator("searchButton").click(this.page);
  }

  getResultCards() {
    return this.page.locator(".orangehrm-directory-card");
  }

  async getFirstResultText(): Promise<string> {
    return this.getResultCards().first().innerText();
  }
}

PageFactory.register("directory/directory", DirectoryPage);
