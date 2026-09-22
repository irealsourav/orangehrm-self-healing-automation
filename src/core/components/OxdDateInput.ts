import type { Page } from "@playwright/test";
import type { SelfHealingLocator } from "@core/locators/SelfHealingLocator.js";

/**
 * OrangeHRM's date fields use `yyyy-dd-mm` format (day before month,
 * confirmed live — not the usual yyyy-mm-dd) and don't reliably accept a
 * plain `.fill()`: the framework's own input mask needs real keystrokes to
 * register. Select-all + backspace + type sequentially, instead.
 */
export class OxdDateInput {
  constructor(
    private readonly input: SelfHealingLocator,
    private readonly page: Page,
  ) {}

  /**
   * value must already be in yyyy-dd-mm format. Confirmed live: the
   * select-all+retype sequence doesn't always register on the first
   * attempt (the same class of flakiness as this widget's other custom
   * OXD siblings) — verify the value actually stuck and retry rather than
   * silently proceeding with an unset/wrong date.
   */
  async setDate(value: string): Promise<void> {
    const locator = await this.input.resolve(this.page);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await locator.click();
      await locator.press(process.platform === "darwin" ? "Meta+a" : "Control+a");
      await this.page.keyboard.press("Backspace");
      await locator.pressSequentially(value, { delay: 50 });
      await this.page.keyboard.press("Escape");
      await this.page.waitForTimeout(300);
      if ((await locator.inputValue()) === value) return;
    }
    throw new Error(`OxdDateInput: value "${value}" did not stick after 3 attempts.`);
  }
}
