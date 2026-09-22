---
name: story-to-testcases
description: Given a Jira Story issue key, read its Acceptance Criteria via the Atlassian MCP and generate the Test Case issues that verify it — linked back to the Story. This is the actual starting point of the pipeline, upstream of jira-test-to-playwright: Stories come first, Test Cases are derived from them, never authored standalone. Use whenever a new Story is added to Jira and needs test coverage, or when retrofitting Stories under Test Cases that were created ad hoc. Generated Test Cases must include at least one genuine end-to-end scenario and, where a form is involved, at least one negative/validation case — not only one shallow happy-path test per AC bullet.
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
(see Steps 3 and 3b).

## Reference: verified OrangeHRM navigation & field data

Don't guess field labels, dropdown values, or navigation paths — wrong ones
produce Test Cases that don't match reality, which then produce wrong
Locator Requests downstream. Everything below was captured live from
`https://opensource-demo.orangehrmlive.com` (not assumed), the same way
`src/data/locators/*.json` was built. Extend this table the same way
(inspect the live page) whenever a Story touches a screen not yet listed
here — don't guess new entries either.

| Screen | Navigation | Fields (exact labels/placeholders) | Notable values |
|---|---|---|---|
| Login | — | Placeholder `Username`, Placeholder `Password` | — |
| Add Employee | PIM → Add Employee | Input placeholders `First Name`, `Middle Name`, `Last Name`; separate field `Employee Id` (auto-filled, editable) | — |
| Employee List / Search | PIM → Employee List | `Employee Name` search box | — |
| Add User | Admin → Add User | `User Role` (select), `Employee Name` (autocomplete), `Status` (select), `Username`, `Password`, `Confirm Password` | User Role options: `Admin`, `ESS` |
| Assign Leave (Admin assigns to any employee) | Leave → Assign Leave | `Employee Name` (autocomplete), `Leave Type` (select), `Leave Balance` (read-only), `From Date`, `To Date`, `Comments` | Leave Type options include `CAN - Vacation`, `CAN - Personal`, `CAN - Bereavement`, `CAN - FMLA`, `CAN - Matternity` (sic — that's the app's actual spelling, keep it verbatim), and `US -` equivalents. **Date fields use `yyyy-dd-mm` format (day before month, not the usual `yyyy-mm-dd`)** — confirmed live; a Test Case step that fills a date must say so explicitly or a generated Playwright test will silently type the wrong date. |
| Apply Leave (self-service, logged-in user only) | Leave → Apply | Same Leave Type list, no Employee Name field — applies to whoever is logged in | Use **Assign Leave**, not **Apply**, whenever a Test Case needs Admin to act on an *arbitrary* employee (e.g. the E2E onboarding journey) |
| Directory | Directory | Name search box | — |
| My Info | My Info | Contact fields (phone, address, etc.) | — |

## Step 3 — Decide atomic vs. end-to-end, and generate BOTH when it fits

For a Story with N acceptance criteria, the mechanical move is N atomic
Test Cases, one per bullet. That's necessary but not sufficient. Before
finishing, ask: **does satisfying this Story actually require multiple
criteria to hold true about the *same* piece of data, in sequence, possibly
across modules?** If yes, add at least one end-to-end Test Case that chains
those criteria into a single continuous scenario.

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

## Step 3b — Add a negative/validation case wherever a form is involved

This was a real gap in the first batch this skill produced (SCRUM-5..14):
every one of them was happy-path. A form that only gets tested with valid
input never proves its validation actually works. Whenever an AC bullet
involves submitting a form, ask whether a negative counterpart is worth
adding — usually yes for anything with a required field or a uniqueness
constraint.

**Do not guess the validation message text.** "An error appears" isn't
verifiable — the exact string is what a Playwright assertion will actually
check. Verify it live (the same technique used everywhere else in this
repo: a throwaway Playwright script against the real app) before writing
the Expected Result, the same as any other field in the reference table
above. Three real, verified examples, created exactly this way and linked
to their Stories:

**SCRUM-21**, linked to SCRUM-15 (Employee Record Management):
> **Summary:** `[PIM] Add Employee Without Mandatory Fields Shows Validation Error`
>
> **Preconditions:** Logged in as Admin, on PIM → Add Employee
>
> **Steps:**
> 1. Leave the First Name field empty
> 2. Leave the Last Name field empty
> 3. Click Save
>
> **Expected Result:** The form does not submit. A "Required" validation
> message is shown under both the First Name and Last Name fields, and the
> user remains on the Add Employee page.

**SCRUM-22**, linked to SCRUM-17 (System User Administration) — note the
precondition exploits a fact we already know is always true on this app
(the seeded `Admin` account) rather than depending on another Test Case
having run first:
> **Summary:** `[Admin] Add System User with Duplicate Username Shows Validation Error`
>
> **Preconditions:** Logged in as Admin, on Admin → Add User. The username
> "Admin" already exists (it is the seeded default account).
>
> **Steps:**
> 1. Select any User Role and a valid Employee Name
> 2. Set Status to Enabled
> 3. Enter "Admin" as the Username
> 4. Enter matching values in Password and Confirm Password
> 5. Click Save
>
> **Expected Result:** The form does not submit. An "Already exists"
> validation message is shown under the Username field, and the user
> remains on the Add User page.

**SCRUM-23**, linked to SCRUM-17:
> **Summary:** `[Admin] Add System User with Mismatched Passwords Shows Validation Error`
>
> **Steps:** ... enter different values in Password and Confirm Password ...
>
> **Expected Result:** The form does not submit. A "Passwords do not
> match" validation message is shown under the Confirm Password field.

Notice all three still follow the same three-part structure as a
happy-path case — a negative case is not an excuse to be vaguer, if
anything the Expected Result needs to be *more* precise (which field,
which exact message) since "an error appears" alone isn't verifiable.

**Known gap, deliberately left open:** an Assign Leave case with To Date
before From Date (invalid range) was attempted but its exact validation
behavior couldn't be pinned down through scripted input in the time spent
(the date widget didn't behave predictably under `.fill()` or scripted key
sequences — worth a slower, more careful live session, possibly interactive,
before writing that Expected Result). Don't invent this one — leave it
undone rather than ship a guessed message, and pick it up properly next
time this skill runs against the Leave Request Workflow story.

## Step 4 — Write each field with intent, not just structure

Every Test Case gets this description structure:

```
**Preconditions:** ...

**Steps:**
1. ...
2. ...

**Expected Result:** ...
```

Having the right structure is necessary but not sufficient — the failure
mode this section exists to prevent is filling that structure with vague
placeholders that technically parse but don't actually constrain anything.

**Preconditions** — state exactly what must already be true, as one of
three kinds (a Test Case often needs more than one):
- *Auth state*: "Logged in as Admin", "Logged in as an ESS user"
- *Data state*: what must already exist, specific enough to act on — not
  "an employee exists" but "an employee exists with a known name" (and if a
  prior Test Case created it, say so: "e.g. the employee created in
  SCRUM-5"). Vague data preconditions are exactly how you end up with a
  generated Playwright test that has nothing to search for.
- *Environment/navigation state*: "on PIM → Add Employee" when it matters
  that the test starts already on a specific screen rather than navigating
  there as step 1.

**Steps** — one imperative user action per line, using the *exact* field
labels from the reference table above, never an assertion disguised as a
step:
- Good: `2. Enter "Vacation" in the Leave Type dropdown`
- Bad: `2. Set the leave type` (which one?) or `2. Enter the leave type and
  verify it saved` (that's an assertion — it belongs in Expected Result)

**Expected Result** — must describe something a Playwright `expect(...)`
could directly check: a specific piece of visible text, a URL, an element's
presence/absence, a field's persisted value. Not "it works" or "the page
updates correctly."
- Good: `The employee's record shows "Canadian" as Nationality after
  reloading the page.`
- Bad: `The change is saved successfully.` (saved where? checked how?)

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
and call out which ones are end-to-end vs. atomic vs. negative. Then this
is ready to hand to `jira-test-to-playwright`.

## Full worked example, start to finish

This is exactly what running this skill against a real Story produced —
copy this shape, don't just copy this content.

**Story SCRUM-15, "Employee Record Management":**
```
**Acceptance Criteria:**
- Admin can add a new employee with mandatory fields (First Name, Last
  Name) and the employee appears in the Employee List
- Admin can search the Employee List by name and see only matching results
- Admin can edit an existing employee's personal details and the changes
  persist
```

**→ Three atomic Test Cases, one per bullet** (SCRUM-5, SCRUM-6, SCRUM-9),
each linked to SCRUM-15 via Relates. SCRUM-5 in full:

```
Summary: [PIM] Add Employee (mandatory fields only)

**Preconditions:** Logged in as Admin

**Steps:**
1. Navigate to PIM → Add Employee
2. Enter First Name and Last Name
3. Click Save

**Expected Result:** Employee is created and appears in the Employee List;
the Personal Details page for the new employee opens.
```

**→ Plus one end-to-end Test Case** (SCRUM-19), because the three atomic
cases above — together with the atomic cases under SCRUM-16 "Leave Request
Workflow" and SCRUM-17 "System User Administration" — never actually prove
that *one* employee survives correctly through all three modules. SCRUM-19
in full, linked to SCRUM-15, SCRUM-16, and SCRUM-17:

```
Summary: [E2E] New Hire Onboarding Journey

**Preconditions:** Logged in as Admin

**Steps:**
1. Add a new employee (PIM → Add Employee) with mandatory fields; note the
   employee's name
2. Verify the employee appears in the Employee List by searching for their
   name
3. Add a System User (Admin → Add User) linked to that employee, with role
   ESS and status Enabled
4. Assign leave to that employee (Leave → Assign Leave), selecting a leave
   type and date range
5. Navigate to Leave List and locate the assigned leave record for that
   employee

**Expected Result:** The employee exists consistently across all three
modules — visible in the PIM Employee List, has a linked, enabled system
user in Admin → Users, and has a correctly attributed leave record in the
Leave List. No data is lost or inconsistent as the employee record flows
through PIM → Admin → Leave.

**Why this is end-to-end:** unlike the individual module test cases, this
scenario proves the modules agree with each other about the *same*
employee, which none of the single-module cases can catch on their own.
```

Note step 3 uses the exact User Role option (`ESS`) and step 4 correctly
uses **Assign Leave** rather than **Apply** — both pulled straight from the
reference table above, not guessed.
