import type { Page } from "@playwright/test";
import type { SelfHealingLocator } from "@core/locators/SelfHealingLocator.js";

/**
 * OrangeHRM's custom dropdown ("oxd-select") isn't a native <select> — it's
 * a clickable box that opens a floating options list. Every form in this
 * app that has a dropdown (Nationality, Leave Type, User Role, Status,
 * Sub Unit, ...) uses this exact widget. Wrapping the two-step interaction
 * (click the trigger, click the option) once here means every Page Object
 * gets `.selectOption(...)` instead of reimplementing this dance, and a
 * markup change to the widget is a one-file fix instead of an N-file one.
 *
 * Composed into a Page Object, not extended — a Page Object owns one of
 * these per dropdown it has, built from a self-healing locator for the
 * trigger element the same way any other field is declared.
 */
export class OxdSelect {
  constructor(
    private readonly trigger: SelfHealingLocator,
    private readonly page: Page,
  ) {}

  async selectOption(optionText: string): Promise<void> {
    await this.trigger.click(this.page);
    await this.page
      .locator(".oxd-select-option")
      .filter({ hasText: optionText })
      .first()
      .click();
  }
}
