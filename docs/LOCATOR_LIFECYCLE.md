# Locator Lifecycle: from Jira story to healed, stable selector

This document covers two things: (1) the different *moments* at which
healing can happen, and (2) how a brand-new UI element — one that doesn't
exist yet when a story is written — ends up with a stable, purpose-built
locator in both the app's source and our locator repository.

## 1. Four healing triggers, not one

The engine built so far (`SelfHealingLocator`) only covers the first of
these. The other three are planned, later phases.

| # | Trigger | When it runs | What it can fix |
|---|---|---|---|
| 1 | **Runtime chain fallback** (built) | Every test, every run | Falls back among *already-declared* candidates. Deterministic, no LLM call, near-zero cost when the primary is healthy. |
| 2 | **Proactive health check** (planned) | Scheduled (e.g. nightly GitLab CI pipeline) | Visits every page and checks whether each descriptor's *primary* candidate specifically still resolves — even if a fallback is currently masking the failure. Silent fallback-masking is real technical debt: every affected element pays a fallback timeout on every run, forever, until someone notices. This job produces a report (which locators are running on a fallback, for how long) and opens tracking issues. |
| 3 | **CI-failure agentic healing** (planned, the `heal-locator` skill) | After a test fails with `LocatorHealingFailedError` (every candidate exhausted, nothing left to fall back to) | Reads the failed run's trace/DOM snapshot, proposes a brand-new candidate using the descriptor's `description` field as intent, opens a merge request. This is the only trigger that invents a selector never configured by a human. |
| 4 | **Story-driven pre-emptive provisioning** (planned, below) | When a new Jira story adds new UI | Adds a stable `data-playwright-id` to the element *before* any test runs against it, so the framework never has to "heal" a brand-new element in the first place — it starts on solid ground instead of a brittle CSS/text guess. |

Trigger 2 matters at scale specifically: with 10,000 tests, "the fallback is
quietly covering for a broken primary" is a performance leak (extra probe
time on every run) that a pass/fail test result will never surface — you
need a check whose whole job is looking at the *shape* of the healing log,
not just whether tests passed.

## 2. Story → acceptance criteria → test case → locator → source attribute

The full loop the framework should support, once Phase 2+ (MCP, skills) are
in place:

```
Jira Story (Acceptance Criteria)
        |  skill: story-to-testcases
        v
Jira Test Case issue(s), linked to the story
        |  skill: jira-test-to-playwright
        v
tests/e2e/<module>/*.spec.ts  +  a list of "Locator Requests"
        |                        (elements the test needs that
        |                         aren't in the repository yet)
        v
src/data/locators/<module>/*.json   <-- new descriptor added,
        |                                candidates start as best-guess
        |                                (role/text/css), NOT ideal
        |  skill: provision-locator
        v
Component Mapping Registry  -->  SUT source file (a .vue component)
        |
        v
data-playwright-id="<module>-<page>-<element>" added to that file,
via an MR against the application's own repository
        |
        v
Once merged + deployed: provision-locator adds
{ strategy: "testId", value: "..." } as the NEW PRIMARY candidate
```

The key insight: a "Locator Request" generated straight from a test case
(step C above) can only guess at a selector — role, visible text, rough CSS
— because it has no access to the running DOM yet if the feature is still
being built, and even once built, guessed selectors are exactly the brittle
kind this whole framework exists to route around. The `provision-locator`
skill closes that gap by pushing a *real, purpose-built* test hook back into
the application source, and only then promoting it to primary. This is
"healing before it breaks" — proactive rather than reactive.

### The Component Mapping Registry

This is the answer to "how do we map UI source files to the Playwright
`pages` folder": a small, explicit manifest, `src/data/component-map.json`,
pairing each Page Object's `pageKey` with the application source file(s) it
corresponds to:

```json
{
  "auth/login": {
    "sutRepo": "orangehrm/orangehrm",
    "componentPath": "src/client/src/views/Auth/Login.vue"
  },
  "pim/addEmployee": {
    "sutRepo": "orangehrm/orangehrm",
    "componentPath": "src/client/src/views/Pim/AddEmployee.vue"
  }
}
```

Two ways entries get created:
- **By convention**: our `<module>/<page>` naming already mirrors OrangeHRM's
  own `views/<Module>/<Page>.vue` folder structure for most screens, so a
  resolver can guess the mapping automatically and only needs confirmation.
- **By explicit registry entry**: for shared/reused components, dynamically
  composed fields, or anything that doesn't mirror cleanly — a human, or the
  provisioning skill itself the first time it successfully resolves one,
  records the entry so it's never re-guessed.

The naming convention for the injected attribute is derived directly from
the locator descriptor's own key, so it's traceable in both directions —
grep the attribute in the source, know exactly which Page Object/JSON entry
owns it:

```
data-playwright-id="<module>-<page>-<element>"   e.g. "pim-addemployee-firstname-input"
```

### The open question this design depends on

`provision-locator` needs to **open a merge request against the
application's own source repository**, adding attributes to its `.vue`
files. That's only possible if we control where that application is
deployed. Against the live public demo
(`opensource-demo.orangehrmlive.com`) — a shared, third-party-operated
instance — we cannot make an MR of ours take effect on the site we're
actually testing. OrangeHRM's Community Edition source *is* public
(`github.com/orangehrm/orangehrm`, PHP/Symfony + Vue 3), so this is solvable,
but it means self-hosting our own fork (Docker Compose: the app + MySQL) as
the real test target for this part of the loop, instead of — or alongside —
the public demo.
