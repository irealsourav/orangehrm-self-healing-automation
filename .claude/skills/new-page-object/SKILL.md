---
name: new-page-object
description: Scaffold a new Page Object for this Playwright self-healing automation framework — the locator JSON, the Page Object class, its PageFactory registration, and its fixture wiring, all following this repo's exact module/page conventions. Use whenever a new OrangeHRM screen (or any new page) needs to be automated, so every addition looks identical regardless of who or what created it. This is the mechanical step that has to scale cleanly to hundreds of pages / thousands of tests without drifting from convention.
---

# Scaffold a new Page Object

Read `docs/ARCHITECTURE.md` first if you have not already — this skill exists
to enforce the conventions documented there. Treat
`src/pages/auth/LoginPage.ts` + `src/data/locators/auth/login.json` as the
canonical example to match exactly.

## Inputs needed

Ask the user (if not already given) for:
1. **Module name** — lowercase, matches an OrangeHRM module (`pim`, `leave`,
   `admin`, `recruitment`, `time`, ...). Reuse an existing module folder if
   one already exists; do not invent a new spelling for an existing module.
2. **Page name** — camelCase, describing the specific screen (`addEmployee`,
   `employeeList`, `applyLeave`, ...).
3. **The elements this page needs** — a short list of `{ id, description }`
   pairs (e.g. `firstNameInput` — "First Name text field on the Add Employee
   form"). If the user doesn't have exact selectors yet, that's fine —
   candidates start as best-effort guesses (role/text/css) and get promoted
   or corrected later, either by runtime self-healing or by the
   `heal-locator` skill. Never invent a `testId` candidate — that strategy
   only belongs in the JSON once a real `data-testid`/`data-playwright-id`
   actually exists in the app's DOM.

If you have live access to the target page (e.g. via a quick Playwright
probe script, the same technique used to build the login page originally),
prefer that over guessing — verify real selectors instead of assuming them.

## What to create, in this exact order

The `pageKey` is always `<module>/<page>` and must be identical across all
three of the following files — that's what keeps navigation-by-name working
at scale.

**1. `src/data/locators/<module>/<page>.json`**

```json
{
  "<elementId>": {
    "id": "<elementId>",
    "description": "<human description used in healing logs and error messages>",
    "candidates": [
      { "strategy": "<bestAvailableStrategy>", "value": "<value>" }
    ]
  }
}
```

Order candidates most-reliable-first: `testId` > `role` > `label` >
`placeholder` > `text` > `css` > `xpath`. Include at least 2 candidates per
element when possible — a chain of one defeats the purpose of self-healing.

**2. `src/pages/<module>/<PageName>Page.ts`** (PageName = page name,
PascalCased)

```ts
import type { Page } from "@playwright/test";
import { BasePage } from "@core/pages/BasePage.js";
import { PageFactory } from "@core/pages/PageFactory.js";

export class <PageName>Page extends BasePage {
  protected readonly pageKey = "<module>/<page>";

  constructor(page: Page) {
    super(page);
  }

  // one method per user-facing action/assertion, never expose raw locators
}

PageFactory.register("<module>/<page>", <PageName>Page);
```

Methods should read like the domain, not like Playwright calls — e.g.
`fillFirstName(value)`, `submit()`, `getValidationError(field)` — mirroring
`LoginPage.login()` / `LoginPage.getErrorMessage()`.

**3. `src/pages/index.ts`** — add one import line for the new module (this
is what triggers the `PageFactory.register` call). If the module doesn't
have a barrel entry yet, add it; do not import individual pages anywhere
else.

**4. `src/core/fixtures/test-fixtures.ts`** — only if this page will be used
across multiple test files (the common case). Add a fixture entry following
the existing `loginPage`/`dashboardPage` pattern. A page used by exactly one
spec can instead be constructed inline via `PageFactory.create(...)` in that
spec — don't over-extend the shared fixture file for one-off pages.

## After scaffolding

Run, in order, and fix anything that fails before considering the task done:
```
npx tsc --noEmit
npx eslint . --ext .ts
```

Do not write the test spec itself unless asked — this skill's job is the
Page Object layer. Pair it with the `jira-test-to-playwright` skill (or a
direct request) for the actual test.
