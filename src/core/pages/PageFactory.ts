import type { Page } from "@playwright/test";
import type { BasePage } from "@core/pages/BasePage.js";

type PageCtor<T extends BasePage> = new (page: Page) => T;

/**
 * Factory pattern: tests ask for a page by logical key ("login", "pim.addEmployee", ...)
 * instead of importing and constructing the concrete class themselves. Each
 * Page Object module registers itself on import (see the bottom of LoginPage.ts),
 * so adding a new page never means touching this file.
 */
export class PageFactory {
  private static registry = new Map<string, PageCtor<BasePage>>();

  static register<T extends BasePage>(key: string, ctor: PageCtor<T>): void {
    this.registry.set(key, ctor as PageCtor<BasePage>);
  }

  static create<T extends BasePage>(key: string, page: Page): T {
    const ctor = this.registry.get(key);
    if (!ctor) {
      throw new Error(
        `No page registered under key "${key}". Did you forget to import its module (which self-registers)?`,
      );
    }
    return new ctor(page) as T;
  }
}
