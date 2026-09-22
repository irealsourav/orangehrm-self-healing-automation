# Architecture

## Target application
OrangeHRM public demo (`https://opensource-demo.orangehrmlive.com`) — free, no
signup, multi-module (Dashboard, PIM, Leave, Admin, Recruitment, Time), built
as a Vue.js SPA. Public credentials: `Admin` / `admin123`.

## Layers and design patterns

```
tests/e2e/<module>/*.spec.ts   <- test intent only, no selectors, no raw Playwright calls
        |
src/core/fixtures/             <- wires Page Objects into Playwright's test runner
        |
src/pages/<module>/*.ts         <- Page Objects (Page Object Model): one class per screen
        |  extends
src/core/pages/BasePage.ts      <- common `locator(id)` helper
        |  built via
src/core/pages/PageFactory.ts        <- Factory pattern: string key -> Page Object instance
        |
src/core/locators/SelfHealingLocator.ts  <- Strategy pattern: tries an ordered
        |                                    chain of resolution strategies
src/core/locators/strategies/*.ts        <- one class per strategy (testId, role,
        |                                    label, placeholder, text, css, xpath)
src/core/locators/LocatorRepository.ts   <- Repository pattern: JSON-backed
        |                                    storage + the write-back that
        |                                    promotes a healed candidate
src/data/locators/<module>/*.json        <- the actual locator data, per page
```

Every layer is organized `<module>/<page>` (e.g. `auth/login`, `dashboard/overview`,
later `pim/addEmployee`) — the same key is used as the Page Object's `pageKey`,
its `PageFactory` registration key, and its locator JSON path. One naming
scheme, three places, zero ambiguity about where anything lives — this is
what keeps a 10,000-test suite navigable instead of a flat pile of files.

## Scaling to large suites (10,000+ tests)

**Understandability**: the module-mirrored folder structure above. Anyone
can find `pim.addEmployee`'s Page Object, its locators, and its tests by
name alone, in three parallel locations, without grepping the repo.

**Performance — the big lever, authentication reuse**: `tests/setup/auth.setup.ts`
runs once (a dedicated Playwright "setup project") and persists the logged-in
session (cookies + localStorage) to `playwright/.auth/admin.json`. Every
other test project loads that file as its `storageState` and starts already
authenticated — no test drives the login form except the login tests
themselves, which intentionally run in a separate, unauthenticated
`chromium-unauthenticated` project (see `playwright.config.ts`). At 10,000
tests this is the difference between one login and ten thousand.

**Performance — sharding**: Playwright supports `--shard=<i>/<n>` natively;
a GitLab CI matrix job (Phase 7) splits the suite across N parallel runners,
each producing a `blob` report, merged afterward into one HTML report via
`playwright merge-reports`.

**Performance — self-healing budget**: the primary/fallback timeout split
(see below) means healing overhead is paid only by tests that actually hit a
broken primary locator — the common case (primary resolves) costs nothing
extra.

**Selective runs**: `test.describe` tags (`@smoke`, `@module:pim`, ...) let
CI run a fast smoke subset on every push and the full suite on a schedule,
rather than always running all 10,000.

`EnvConfig` (`src/config/env.ts`) and `HealingLogger` are Singletons: one
shared instance per process, so config and healing-event logging stay
consistent across parallel test workers.

## How self-healing actually works

Each element is declared not as one selector, but as an **ordered list of
candidates**, each tagged with a strategy:

```json
"usernameInput": {
  "candidates": [
    { "strategy": "placeholder", "value": "Username" },
    { "strategy": "css", "value": "input[name=\"username\"]" },
    { "strategy": "xpath", "value": "//div[label[text()='Username']]//input" }
  ]
}
```

At runtime, `SelfHealingLocator.resolve()`:
1. Builds a live Playwright `Locator` for candidate #0 (the primary) and
   waits for it to attach, using a **generous** timeout — the same patience
   Playwright normally gives any action — so a slow-loading app is never
   mistaken for a broken selector.
2. If the primary fails, it moves to candidate #1, #2, ... each with a
   **short** probe timeout (the app has already had time to settle by then).
3. The first candidate that attaches wins and is used for the actual
   action (`click`, `fill`, etc).
4. If the winner wasn't the primary, the repository JSON is rewritten so the
   winning candidate becomes primary from now on, and a `healHistory` entry
   is appended — this is the "self-healing" part: the framework adapts
   in-place, without anyone editing the JSON by hand.

This is **runtime, deterministic healing** — it only ever falls back among
candidates a human (or the agent skill below) already declared. It cannot
invent a selector that was never configured.

### The second layer: agentic healing (on-demand, not live in the pipeline)

If **every** declared candidate fails, `SelfHealingLocator` throws a
`LocatorHealingFailedError` — there's nothing left to fall back to. That
failure is what triggers the `heal-locator` Claude Code skill (built in a
later phase): it reads the failed run's Playwright trace/DOM snapshot,
uses the element's `description` field as intent, proposes a brand-new
candidate, and opens a merge request. This keeps the CI pipeline itself
fully deterministic (no live LLM calls mid-run) while still making the
framework self-repairing over time.

## A real bug this design caught (kept here as a lesson, not swept away)

The first end-to-end run produced a *false* healing event on the dashboard
breadcrumb: the CSS and XPath candidates pointed at the identical class, yet
the engine "healed" from one to the other. Root cause: every candidate,
including the primary, was probed with the same short 3s timeout, and the
OrangeHRM SPA sometimes takes longer than that to render after a login
redirect — so the primary was timing out on page-load lag, not selector
breakage. Fixed by giving the primary a full normal timeout and only
fallbacks a short one (see `SelfHealingLocator.ts`). Confirmed by re-running:
no more spurious heals, and a deliberately-broken primary still heals
correctly to the right fallback.

## Known issue: concurrency degrades the shared public demo itself

Confirmed by direct A/B testing while building out the PIM/Admin/Leave/
Directory test coverage: running just 2 concurrent Playwright workers (or 2
GitLab CI shards) against the public demo caused tests that are rock solid
in isolation — e.g. Add Employee's save-then-redirect — to start failing,
purely from two sessions writing around the same time, not from any bug in
this framework's code. `playwright.config.ts` sets `workers: 1` and
`.gitlab-ci.yml` runs the `e2e` job unsharded as a direct, evidence-based
response to this, not a cautious default. It trades suite wall-clock time
for reliability. The actual fix for real parallelism is Stage B
(self-hosting, see `docs/LOCATOR_LIFECYCLE.md`) — a public demo with
unknown capacity was never going to support it.

## Known issue: search-index lag on newly-created employees (4 tests affected)

Even at `workers: 1`, four tests remain genuinely flaky: `SCRUM-8` (Add
User), `SCRUM-19` (New Hire Onboarding), `SCRUM-14` and `SCRUM-20`
(Directory search). All four share one shape: create an employee, then
*immediately* look them up via a **different** page's Employee Name
autocomplete (Add User's, Assign Leave's, or Directory's). Employee List's
own autocomplete search for the exact same freshly-created employee passes
reliably every time (`SCRUM-6`) — the same widget, same selector pattern,
same page-object convention. That contrast is the actual evidence: Employee
List's search appears to query live data directly, while Add User / Assign
Leave / Directory's autocomplete appears to hit a separately-indexed search
endpoint that hasn't caught up yet for a record created moments earlier.

`OxdAutocomplete.selectByText()` already retries the full type-and-search
cycle three times with 2s gaps (~20s total) specifically to give that index
time to catch up, and throws a clear, descriptive error rather than
silently clicking a non-option when it never resolves — this is a real
improvement over the original behavior (confirmed: before this fix, the
same failure silently searched Directory's entire unfiltered, years-old
accumulated dataset and returned a garbage first result instead of erroring).
It measurably helps (this class of test now passes probabilistically rather
than never), but doesn't fully eliminate the lag on a shared instance whose
actual indexing latency is outside this framework's control. Options not
yet pursued: a longer retry budget (diminishing returns, makes already-slow
tests slower); using a pre-existing stable employee instead of a
freshly-created one (weakens the actual "does the app immediately reflect a
new employee everywhere" scenario these tests exist to check); or, again,
Stage B self-hosting, where indexing latency (if it exists at all) would be
something this project could actually observe and tune rather than guess at
from outside.
