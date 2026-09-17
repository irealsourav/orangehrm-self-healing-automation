import type { Locator, Page } from "@playwright/test";
import { LocatorRepository } from "@core/locators/LocatorRepository.js";
import { HealingLogger } from "@core/locators/HealingLogger.js";
import { strategyRegistry } from "@core/locators/strategies/index.js";
import type { LocatorDescriptor } from "@core/locators/types.js";

export class LocatorHealingFailedError extends Error {
  constructor(pageKey: string, descriptor: LocatorDescriptor) {
    super(
      `All ${descriptor.candidates.length} candidate locator(s) for "${descriptor.id}" ` +
        `("${descriptor.description}") on page "${pageKey}" failed to resolve. ` +
        `This element needs a new candidate added to the locator repository — ` +
        `run the heal-locator skill against the failed trace to propose one.`,
    );
    this.name = "LocatorHealingFailedError";
  }
}

interface Options {
  /**
   * Timeout for the primary (index 0) candidate. Kept generous — equal to
   * Playwright's normal action-wait budget — so a slow-rendering app never
   * gets misread as "the selector broke."
   */
  primaryTimeoutMs?: number;
  /**
   * Timeout for each fallback candidate. Kept short: by the time we're
   * probing a fallback, the primary has already spent its full budget
   * waiting, so the app has had time to settle.
   */
  fallbackTimeoutMs?: number;
}

/**
 * The Strategy "context": walks the descriptor's candidate chain in order,
 * asking the matching StrategyHandler to build a live Locator, and probing
 * each with a short attached/visible wait. The first candidate that resolves
 * wins. If it wasn't candidate #0, the repository is updated so the healed
 * candidate becomes primary from now on (deterministic, in-process healing).
 */
export class SelfHealingLocator {
  constructor(
    private readonly pageKey: string,
    private readonly id: string,
    private readonly options: Options = {},
  ) {}

  async resolve(page: Page): Promise<Locator> {
    const descriptor = LocatorRepository.get(this.pageKey, this.id);
    const primaryTimeoutMs = this.options.primaryTimeoutMs ?? 10000;
    const fallbackTimeoutMs = this.options.fallbackTimeoutMs ?? 2000;

    for (const [index, candidate] of descriptor.candidates.entries()) {
      const handler = strategyRegistry.get(candidate.strategy);
      if (!handler) continue;

      const locator = handler.build(page, candidate);
      const timeout = index === 0 ? primaryTimeoutMs : fallbackTimeoutMs;
      try {
        await locator.first().waitFor({ state: "attached", timeout });
      } catch {
        continue; // try the next candidate in the chain
      }

      if (index > 0) {
        const previousPrimary = descriptor.candidates[0];
        LocatorRepository.promote(this.pageKey, this.id, index);
        HealingLogger.getInstance().log({
          timestamp: new Date().toISOString(),
          pageKey: this.pageKey,
          descriptorId: this.id,
          description: descriptor.description,
          healedIndex: index,
          previousPrimaryValue: previousPrimary?.value ?? "(none)",
          healedWithValue: candidate.value,
        });
      }
      return locator;
    }

    throw new LocatorHealingFailedError(this.pageKey, descriptor);
  }

  async click(page: Page): Promise<void> {
    await (await this.resolve(page)).click();
  }

  async fill(page: Page, value: string): Promise<void> {
    await (await this.resolve(page)).fill(value);
  }

  async textContent(page: Page): Promise<string | null> {
    return (await this.resolve(page)).textContent();
  }

  async isVisible(page: Page): Promise<boolean> {
    try {
      return await (await this.resolve(page)).isVisible();
    } catch {
      return false;
    }
  }
}
