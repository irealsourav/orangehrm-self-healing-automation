# OrangeHRM Self-Healing Automation

A Playwright + TypeScript UI automation framework with self-healing
locators, targeting the [OrangeHRM demo application](https://opensource-demo.orangehrmlive.com).

Full design write-up: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/LOCATOR_LIFECYCLE.md](docs/LOCATOR_LIFECYCLE.md)

## Why self-healing locators

Instead of one hardcoded selector per element, each element is declared as
an ordered chain of resolution strategies (`data-testid` → ARIA role →
label → placeholder → text → CSS → XPath). If the primary strategy stops
matching — a rename, a markup change — the engine automatically falls back
to the next one, and **writes the working candidate back** into the locator
repository as the new primary. No hand-editing of selectors after every UI
change.

## Getting started

```bash
npm ci
npx playwright install chromium --with-deps   # first time only
npm test                    # headless run
npm run test:headed         # see the browser
npm run test:ui             # Playwright's interactive UI mode
npm run test:report         # open the last HTML report
```

Default target is the public OrangeHRM demo (`Admin` / `admin123`).
Override with env vars: `BASE_URL`, `OHRM_USERNAME`, `OHRM_PASSWORD`.

## Project layout

```
src/pages/<module>/*.ts          Page Objects (Page Object Model)
src/data/locators/<module>/*.json  Locator definitions (the healable data)
src/core/locators/                The self-healing engine itself
src/core/pages/                   BasePage + PageFactory
tests/e2e/<module>/*.spec.ts      Test specs
tests/setup/auth.setup.ts         Logs in once, reused via storageState
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the design patterns
behind this layout (Page Object Model, Factory, Strategy, Repository,
Singleton) and why it's structured this way for suites in the thousands of
tests.

## CI

GitHub is the source of truth; GitLab CI runs the full pipeline. Two
GitHub Actions workflows (`.github/workflows/`):

- **`ci.yml`** — fast lint/typecheck/e2e feedback directly on GitHub, on
  every push and PR
- **`mirror-to-gitlab.yml`** — pushes `main` to the GitLab project on every
  commit. (GitLab.com's own pull-mirroring is Premium/Ultimate-only, so
  instead of GitLab pulling from GitHub, GitHub pushes to GitLab — a plain
  `git push` triggers GitLab's normal, Free-tier pipeline.)

GitLab then runs **`.gitlab-ci.yml`** (install → lint → typecheck → e2e)
against that synced copy: https://gitlab.com/irealsourav/orangehrm-self-healing-automation
