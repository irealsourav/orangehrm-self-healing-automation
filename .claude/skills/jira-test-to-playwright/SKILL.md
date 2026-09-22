---
name: jira-test-to-playwright
description: Given a Jira Test Case issue key (e.g. SCRUM-5), fetch it via the Atlassian MCP server and generate the corresponding Playwright spec — plus any missing Page Object elements, added as best-effort "Locator Requests" — following this repo's conventions. Use whenever a Jira Test Case should become an automated test. This is the SECOND stage of the pipeline — the FIRST is the story-to-testcases skill, which derives Test Cases from a Story's Acceptance Criteria; never author a Test Case standalone.

---

# Turn a Jira Test Case into a Playwright test

This is downstream of `story-to-testcases`: a Story's Acceptance Criteria
produces Test Case issues (linked back to the Story via `Relates`), and
*this* skill turns a Test Case into runnable automation. See
`docs/LOCATOR_LIFECYCLE.md` for how this fits into the larger story → AC →
test case → locator lifecycle.

If asked to generate a spec for a Test Case that has no `Relates` link back
to any Story, flag it rather than silently proceeding — that's a sign the
Test Case was authored out of process (skipping `story-to-testcases`) and
the gap should be fixed (create/link the Story) before or alongside
generating the spec.

## Step 1 — Fetch the issue

You need an issue key from the user (e.g. `SCRUM-5`). If the Atlassian MCP
server's tools aren't visible yet, run `ToolSearch` with a query like
`"jira issue get"` to load them — don't guess at a tool name. If the server
still isn't connected/authenticated, stop and tell the user: they need to
complete the OAuth login for the `atlassian` server in an interactive
`claude` session (`/mcp`), which can't be done from a non-interactive
session.

Fetch the issue and read:
- **Summary** — becomes the `test.describe`/`test` title. A `[E2E]` prefix
  or an `e2e` label means this is a cross-module journey (see Step 3).
- **Description** — expect a structured format (Preconditions / Steps /
  Expected Result). If the description is free text instead, do your best
  to extract the same three things rather than refusing.
- **Which module/page(s)** the steps touch — infer from the content (e.g.
  steps mentioning "Add Employee" → `pim/addEmployee`). An end-to-end case
  will touch more than one.

## Step 2 — Check what already exists

For each page the test touches, check whether
`src/pages/<module>/<Page>Page.ts` and
`src/data/locators/<module>/<page>.json` already exist.

- **If the page exists**: check whether it already exposes the methods this
  test needs. Reuse existing methods; don't duplicate a near-identical one.
- **If the page or a needed element doesn't exist yet**: use the
  `new-page-object` skill (or follow its conventions directly) to create it.
  Any element you can't get a confident real selector for still gets a
  descriptor — with your best-guess candidates (role/text/css, never a
  fabricated `testId`) — and gets called out explicitly in your final
  summary as a **Locator Request**: `{ pageKey, id, description }`. These
  are exactly the elements that later get a real `data-testid` /
  `data-playwright-id` provisioned into the app source (Stage B /
  `provision-locator`, once that exists) — don't hide the fact that a
  locator is a guess.

## Step 3 — Generate the spec

Write `tests/e2e/<module>/<kebab-case-title>.spec.ts` (or add a `test(...)`
to an existing describe block if one already covers this flow — don't
create near-duplicate spec files for the same screen).

Rules, matching `tests/e2e/auth/login.spec.ts`:
- Import `test`/`expect` from `@core/fixtures/test-fixtures.js`, never
  straight from `@playwright/test`, unless this test needs a page with no
  fixture yet (then construct it inline via `PageFactory.create`).
- No raw selectors, no raw `page.locator(...)` calls, in the spec file —
  everything goes through Page Object methods.
- One `test()` per Jira Test Case (not per step) unless the case explicitly
  describes multiple independent scenarios.
- **For an `[E2E]` Test Case**, the one `test()` legitimately drives
  multiple Page Objects across multiple modules in sequence — that's
  correct, not a violation of "one page per test." What it must NOT do is
  assert only on the final step; carry the entity created in step 1 (the
  employee's name, say) through every later step and assert on it at each
  module boundary, matching the Test Case's Expected Result about
  cross-module consistency.
- Map Jira's "Expected Result" lines to `expect(...)` assertions as
  literally as reasonable — resist inventing extra assertions the test case
  didn't ask for.

## Step 4 — Verify, don't just generate

Run, and fix anything that fails:
```
npx tsc --noEmit
npx eslint . --ext .ts
npx playwright test <path to the new spec>
```
A generated test that hasn't actually been run against the app is not done.

## Step 5 — Report back

Summarize: which Jira issue, which spec file, which Page Objects were
reused vs. newly created, and — most importantly — list any Locator
Requests (best-guess, unverified selectors) so the user knows exactly which
elements are running on a guess rather than a confirmed selector.
