import type { Page } from "@playwright/test";
import { SelfHealingLocator } from "@core/locators/SelfHealingLocator.js";

/**
 * Every Page Object extends this. Subclasses declare which locator-JSON
 * file (`pageKey`) backs them and get a `locator(id)` helper that returns a
 * self-healing locator scoped to that file — no raw Playwright selectors
 * should ever appear inside a Page Object.
 */
export abstract class BasePage {
  protected abstract readonly pageKey: string;

  constructor(protected readonly page: Page) {}

  protected locator(id: string): SelfHealingLocator {
    return new SelfHealingLocator(this.pageKey, id);
  }
}
