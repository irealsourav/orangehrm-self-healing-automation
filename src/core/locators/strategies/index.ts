import type { Locator, Page } from "@playwright/test";
import type { LocatorCandidate } from "@core/locators/types.js";
import type { LocatorStrategyHandler } from "@core/locators/strategies/LocatorStrategyHandler.js";

/** Most resilient: relies on a dedicated `data-testid`, immune to copy/CSS/DOM churn. */
class TestIdStrategy implements LocatorStrategyHandler {
  readonly kind = "testId" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.getByTestId(candidate.value);
  }
}

/** Accessibility-tree based: survives markup/class renames, breaks only if the UI role/name changes. */
class RoleStrategy implements LocatorStrategyHandler {
  readonly kind = "role" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    const role = candidate.value as Parameters<Page["getByRole"]>[0];
    return page.getByRole(role, {
      name: candidate.roleOptions?.name,
      exact: candidate.roleOptions?.exact,
    });
  }
}

/** Form fields addressed by their visible <label> (works only when label/input are ARIA-associated). */
class LabelStrategy implements LocatorStrategyHandler {
  readonly kind = "label" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.getByLabel(candidate.value);
  }
}

/** Form fields addressed by placeholder text — common on component libraries (e.g. OXD) that skip label `for`/`id` wiring. */
class PlaceholderStrategy implements LocatorStrategyHandler {
  readonly kind = "placeholder" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.getByPlaceholder(candidate.value);
  }
}

/** Visible text content — brittle under copy changes, useful as a mid-chain fallback. */
class TextStrategy implements LocatorStrategyHandler {
  readonly kind = "text" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.getByText(candidate.value, { exact: false });
  }
}

/** Raw CSS selector — last resort before XPath, tightly coupled to current markup. */
class CssStrategy implements LocatorStrategyHandler {
  readonly kind = "css" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.locator(candidate.value);
  }
}

/** XPath — kept for legacy candidates migrated from other frameworks; most brittle of all. */
class XPathStrategy implements LocatorStrategyHandler {
  readonly kind = "xpath" as const;
  build(page: Page, candidate: LocatorCandidate): Locator {
    return page.locator(`xpath=${candidate.value}`);
  }
}

const handlers: LocatorStrategyHandler[] = [
  new TestIdStrategy(),
  new RoleStrategy(),
  new LabelStrategy(),
  new PlaceholderStrategy(),
  new TextStrategy(),
  new CssStrategy(),
  new XPathStrategy(),
];

export const strategyRegistry = new Map(handlers.map((h) => [h.kind, h]));
