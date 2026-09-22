---
name: story-to-testcases
description: Given a Jira Story issue key, read its Acceptance Criteria via the Atlassian MCP and generate the Test Case issues that verify it — linked back to the Story. This is the actual starting point of the pipeline, upstream of jira-test-to-playwright: Stories come first, Test Cases are derived from them, never authored standalone. Use whenever a new Story is added to Jira and needs test coverage, or when retrofitting Stories under Test Cases that were created ad hoc. Generated Test Cases must include at least one genuine end-to-end scenario, not only one shallow test per AC bullet.
---

# Turn a Jira Story's Acceptance Criteria into Test Cases

This is upstream of `jira-test-to-playwright`. The corrected pipeline is:

```
Jira Story (Acceptance Criteria)
        |  <-- this skill
        v
Jira Test Case issue(s), linked to the Story via "Relates"
        |  <-- jira-test-to-playwright skill
        v
tests/e2e/<module>/*.spec.ts
```

Never author a standalone Test Case with no parent Story. If someone asks
for a test case for a feature that has no Story yet, create the Story first
(even a short one — see Step 1) rather than skipping the layer.

## Step 1 — Get or create the Story

You need a Story issue key. If one doesn't exist yet for the feature being
discussed, create it first: `issueTypeName: "Story"`, a `description`
containing an **Acceptance Criteria** bullet list written from the user's
perspective ("Admin can...", "A user can..."). Keep it to 2-4 criteria — a
Story this framework covers is one feature area (e.g. "Employee Record
Management"), not an entire module.

## Step 2 — Read the Acceptance Criteria

Fetch the Story (`getJiraIssue`) and parse its Acceptance Criteria bullets.
Each bullet is a candidate for one atomic Test Case — but don't stop there
(see Step 3).

## Step 3 — Decide atomic vs. end-to-end, and generate BOTH when it fits

For a Story with N acceptance criteria, the mechanical move is N atomic
Test Cases, one per bullet. That's necessary but not sufficient. Before
finishing, ask: **does satisfying this Story actually require multiple
criteria to hold true about the *same* piece of data, in sequence, possibly
across modules?** If yes, add at least one end-to-end Test Case that chains
those criteria into a single continuous scenario. Concrete example from
this repo: "Employee Record Management," "Leave Request Workflow," and
"System User Administration" each got their atomic Test Cases (SCRUM-5..11)
— but none of those alone proves that one newly-created employee correctly
has a linked user account *and* a leave record. That required a separate
scenario, `[E2E] New Hire Onboarding Journey` (SCRUM-19), spanning all three
Stories.

Rules for a genuine end-to-end Test Case (don't just relabel an atomic one):
- It performs a real sequence of user actions across **2+ screens or
  modules**, carrying the same entity (the same employee, the same leave
  request) through all of them.
- Its Expected Result is about **consistency across steps** — "the same
  employee is visible correctly in modules X, Y, and Z" — not just "step 3
  succeeded."
- Title it `[E2E] <Journey name>` so it's visually distinct from atomic
  cases, and label it `e2e` in addition to `test-case`.
- Link it to **every** Story it touches, not just one.

Don't force an end-to-end case where there's no real journey (e.g. "Verify
Dashboard Widgets Render" has nothing to chain) — one atomic case is
correct and sufficient there.

## Step 4 — Create the issues

Use `createJiraIssue` with `issueTypeName: "Task"` (this project has no
dedicated Test Case issue type — no Xray/Zephyr installed), the summary
prefixed with `[Module]` (or `[E2E]` for a journey), and this description
structure:

```
**Preconditions:** ...

**Steps:**
1. ...
2. ...

**Expected Result:** ...
```

Add `**Why this is end-to-end:**` as an extra line for E2E cases, explaining
what a single-module test couldn't have caught — write it for a human
skimming the backlog, not as boilerplate.

`additional_fields`: `{"labels": ["test-case", "<p0|p1|p2>"]}`, plus `"e2e"`
for journey cases.

## Step 5 — Link back to the Story

This project's link types are `Blocks`, `Cloners`, `Duplicate`, `Relates`
only — there's no `Tests`/`is tested by` type (that's an Xray/Zephyr
addition most team-managed projects don't have). Use `Relates` (symmetric,
so direction doesn't matter): `createIssueLink({ inwardIssue: <test case
key>, outwardIssue: <story key>, type: "Relates" })`. Link an end-to-end
case to every Story it spans, not just its "primary" one.

## Step 6 — Report back

List every Test Case created (key + title), which Story each is linked to,
and call out which ones are end-to-end vs. atomic. Then this is ready to
hand to `jira-test-to-playwright`.
