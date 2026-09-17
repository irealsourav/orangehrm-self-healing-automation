import type { Locator, Page } from "@playwright/test";
import type { LocatorCandidate, StrategyKind } from "@core/locators/types.js";

/**
 * One handler = one way of turning a declarative candidate into a live
 * Playwright Locator. Adding a new resolution strategy (e.g. a visual/AI
 * locator later) means adding one class here, nothing else changes.
 */
export interface LocatorStrategyHandler {
  readonly kind: StrategyKind;
  build(page: Page, candidate: LocatorCandidate): Locator;
}
