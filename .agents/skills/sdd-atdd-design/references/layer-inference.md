# Scenario → layer inference (UT / API / E2E + recommended layers)

Classify acceptance scenarios for **ATDD design**. Plan **API** and **E2E**
layers in this skill. Pure-logic checks and single-component / single-view UI
behavior are labeled **Defer UT** (or **Defer UT (component)**) for apply-time
TDD — do **not** expand a full UT suite plan here or promote component
behavior to E2E; hand that to `/sdd:atdd-apply`.

## Decision order (first match wins)

| Priority | Signal | Layer | Notes |
|---|---|---|---|
| 1 | WHEN/THEN is HTTP method + status/body (or single endpoint contract) without
  requiring full UI or multi-system orchestration | **API** | Isolate to one
  service boundary when possible |
| 2 | THEN asserts single-component / single-view UI behavior (conditional
  display, disabled state, empty/loading state, element absence, in-view
  interaction) provable by rendering the component with mocked network |
  **Defer UT (component)** | Apply-time component TDD (e.g. RTL + vitest per
  Project Rules); do **not** promote to E2E |
| 3 | Scenario needs cross-page navigation, real browser capabilities
  (clipboard, download, URL/history), or the real frontend+backend seam to
  observe the outcome | **E2E** | Only the user-perceivable journey that
  lower layers cannot prove |
| 4 | Multi-system or durable-store state needed to observe the result —
  **including “data must not appear”** | **API** if the store is provable at
  the service boundary; **E2E** only when absence is observable solely
  through the full UI path | Do not default DB-absence to E2E |
| 5 | Pure function / in-memory transformation / single-module behavior with no I/O
  or UI | **Defer UT** | List as “apply-time unit TDD”; do not expand a UT suite
  plan in this doc |
| 6 | Ambiguous | Prefer the **cheapest layer that can prove the AC**
  (API > component > E2E); never invent a UT plan to resolve ambiguity |
  Record rationale |

### Compact decision tree

```
Provable at a single API endpoint (incl. store written / not written)?
  ├─ yes → API
  └─ no → single-component / single-view UI behavior?
          ├─ yes → Defer UT (component)
          └─ no → cross-page journey or real-browser capability needed?
                  ├─ yes → E2E
                  └─ no → multi-system → E2E; else Defer UT
```

## Layer definitions (short)

| Layer | Definition | Typical |
|---|---|---|
| **UT** (defer) | Single function/class/module; mock externals | transforms, validators, state machines |
| **Component UT** (defer) | One component/view rendered with mocked network; real DOM assertions | disabled/empty/loading states, conditional rendering, in-view interactions |
| **API** | One endpoint request/response; may use real DB; no UI | input validation, status codes, authz on route |
| **E2E** | Cross-page business path with real frontend+backend | navigate → act → visible outcome across screens |

Same business theme may spawn API + E2E rows; annotate Defer UT for core logic
and component behavior.

## Recommended extra layers (advisory inference)

Scan requirement / design keywords; attach **recommended** layers (not gates):

| Dimension | Trigger signals | Recommend |
|---|---|---|
| Protocol | SSE, WebSocket, GraphQL, streaming | Integration (+ E2E) |
| Performance | SLA, QPS, latency, load | Stress (advisory) |
| Security | authn/z, JWT, PII, encryption | Security (advisory) |
| AI / LLM | intent classify, model quality, accuracy | LLM eval (advisory) |
| Compatibility | multi-browser / device / a11y | Compatibility (advisory) |
| Consistency | payment, idempotency, rollback | Integration + E2E |
| Third-party | webhook, queue, external API | Integration |

Mark “待确认” until tech design review; QA may adjust.

## Non-goal reverse verification

For each Proposal / Ready **Non-goal** / Out-of-scope item, decide whether a
reverse check is observable at a layer **already planned** for this change.
If yes, attach the assertion to that existing API / component / E2E case at
the cheapest observable layer. Do **not** create a dedicated E2E case per
Non-goal; skip reverse automation when no planned layer observes the behavior
(record the rationale instead).

## E2E discipline (matching, not volume)

- Every E2E row must cite the specific AC / scenario it proves. No matching
  AC → no E2E case.
- One E2E case per user journey / AC theme; group related assertions into the
  same case instead of one test per assertion.
- Prefer extending an existing spec file over creating a new one; new spec
  files only for genuinely new feature areas.
- Never re-prove at E2E what an API / component / UT case already proves;
  E2E covers only the cross-page / real-browser seam.
- No layout geometry, pixel, or CSS-class assertions unless the AC explicitly
  requires them (and then assert coarse behavior, not implementation classes).
- If E2E rows outnumber the change's cross-page user-visible ACs, re-run the
  decision order and move isolatable checks down a layer.

## Output shape (short)

For each scenario / AC theme:

| # | Scenario (AC ref) | Layer | Recommended extras | Rationale |
|---|---|---|---|---|
| … | … | API / E2E / Defer-UT (component) / Defer-UT | e.g. SSE integration | one-line signal used |

## Explicit non-goals

- No Playwright / POM / Excel / bulk testcase generators in this skill.
- No ratio policing as a Gate; optional note if E2E seems overloaded vs API —
  suggest moving isolatable checks to API, not to a designed UT suite.
- Project Rules may name local frameworks; follow them without inventing a new
  test product.
