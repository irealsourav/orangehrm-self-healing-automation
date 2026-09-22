import type { Page } from "@playwright/test";
import type { SelfHealingLocator } from "@core/locators/SelfHealingLocator.js";

/**
 * OrangeHRM's "Type for hints..." autocomplete (Employee Name fields
 * throughout PIM, Admin, Leave, and Directory): type text, wait for the
 * suggestion list, click the first match. Same reuse rationale as
 * OxdSelect — one implementation instead of five near-identical ones.
 */
export class OxdAutocomplete {
  constructor(
    private readonly input: SelfHealingLocator,
    private readonly page: Page,
  ) {}

  // Not real, selectable suggestions — sharing the same CSS class as one,
  // confirmed live. Clicking either blindly once produced a garbage,
  // unrelated result (Directory silently fell back to its unfiltered full
  // list — hundreds of accumulated entries from years of public demo use —
  // rather than erroring, which is what made this easy to miss at first).
  private static readonly NON_OPTION_TEXTS = new Set(["Searching....", "No Records Found"]);

  async selectByText(searchText: string): Promise<void> {
    // Confirmed live: an employee created moments earlier is immediately
    // findable via Employee List's own autocomplete, but NOT reliably via
    // this same widget on Add User / Assign Leave / Directory — those
    // appear to hit a separately-indexed search endpoint with a real
    // propagation lag behind the write. One long wait inside a single
    // attempt can't fix a lag in what's already been searched; retrying
    // the whole type-and-search cycle (giving the index more real time to
    // catch up between attempts) can.
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const text = await this.attemptOnce(searchText);
      if (text) return;
      if (attempt < attempts) await this.page.waitForTimeout(2000);
    }
    throw new Error(
      `OxdAutocomplete: no real suggestion appeared for "${searchText}" across ${attempts} attempts (only saw loading/empty states each time). Failing loudly instead of clicking a non-option and silently searching on nothing — if this is a freshly-created record, the app's search index may need more than ~20s to catch up.`,
    );
  }

  /** Returns the matched option's text on success, or "" if this attempt found nothing real. */
  private async attemptOnce(searchText: string): Promise<string> {
    await this.input.fill(this.page, "");
    await this.input.fill(this.page, searchText);
    const firstOption = this.page.locator(".oxd-autocomplete-option").first();
    const deadline = Date.now() + 6000;
    let text = "";
    while (Date.now() < deadline) {
      if ((await firstOption.count()) > 0) {
        text = (await firstOption.innerText()).trim();
        if (text.length > 0 && !OxdAutocomplete.NON_OPTION_TEXTS.has(text)) break;
      }
      await this.page.waitForTimeout(150);
      text = "";
    }
    if (!text) return "";
    await firstOption.click();
    // Confirmed live: the framework's internal bound value lags slightly
    // behind the visual selection — acting immediately (e.g. clicking a
    // Search button right after) can read the stale/empty value and submit
    // an unfiltered search instead of the one just selected.
    await this.page.waitForTimeout(400);
    return text;
  }
}
