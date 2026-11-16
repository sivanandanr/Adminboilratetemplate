# UI Patterns showcase acceptance review

Scope: the user's latest instruction replaces Part 6 business-page migration with a component showcase only. No business-page, shared dirty-tracker, production route or auth-session implementation changes are included. No public API changes, dependencies, commit or push.

| Original acceptance item | Result for the approved scope |
|---|---|
| Remove page-owned toast/dialog/overlay/progress/dirty/idle implementations everywhere | Deferred by explicit user instruction. Existing audited business-page gaps remain; this is not claimed complete. The new showcase contains no native dialog, feedback outlet, dirty tracker or idle timer. |
| One shared implementation, exported from ui/index.ts | Pass for showcase composition. Existing exports are reused. Demo providers supply bounded work, not another UI implementation. Part 5 session visual consolidation remains open. |
| Existing APIs work; breaking changes approved | No API changes. Existing regression suites and shared-control specs are retained. |
| Existing look retained; new pieces use tokens | Showcase uses existing controls/fonts/tokens. Only shared visual correction: outlined success text/border uses the existing theme-aware completed-text token for dark contrast. Workflow and employee-list before/after PNG hashes match exactly. Profile has volatile sign-in timestamp text. |
| Patterns work without page-specific behavior implementations | Demonstrated through shared controls, services, root outlets and guards. Only demo data/work callbacks live in the showcase. Production durable jobs/upload endpoints and footer legal URLs remain deployment prerequisites. Existing idle engine is reused; Part 5's requested modal/progress design is not implemented. |
| Specs, build and tests pass | Verification results below. No changed business components. New unit/integration/browser/axe/screenshot coverage accompanies the showcase and shared success-button contrast correction. |

## Files and design evidence

- `features/dev/ui-patterns.{ts,html,css,spec.ts}`: five sections, typed demo forms, shared guard/modal/toast/progress/task/table/container composition.
- `features/dev/ui-patterns-demo.{provider,interceptor}.ts`: explicitly local, bounded synthetic jobs, measured file reads and development-only HTTP responses.
- Development environment: lazy permission-protected route and opt-in 30-second idle demo. `auth.models.ts`: route permission lookup. Existing component catalog: link to UI Patterns.
- `shared/ui/ui.css`: token-only dark outlined success contrast fix.
- Production verification script: rejects showcase markers and fixture endpoint strings from emitted production JavaScript.
- `e2e/ui-patterns-showcase.spec.ts` and snapshots: outcomes, validation/save, dirty tab/drawer, pager, local files, actual export download, permissions, responsive light/dark and axe.
- `scripts/capture-ui-pattern-migration.cjs` and `docs/design/ui-patterns-migration/{before,after}`: unchanged-page evidence. Existing business source files remain at the committed baseline.

Visual baselines cover all five sections at 390px and 1672px in light and dark themes. The isolated long-form screenshot temporarily neutralizes sticky positioning to show every field. Runtime pinned-footer behavior remains covered by the existing Part 4 browser test; screenshot-only styling does not change application code. Dates are frozen in visual tests for stable baselines. No claim of pixel equivalence to an unavailable dedicated showcase reference is made; existing shared component references remain authoritative.

## Remaining prerequisites

1. Business-page migration is intentionally deferred.
2. Part 5 idle design, shared Modal/ProgressBar consolidation and related new copy remain unimplemented; existing session defaults/engine and synchronization are unchanged.
3. Local CSV checks are basic structure checks, not server upload/security validation. Backend task persistence/refresh recovery needs its production adapter.
4. Approved Privacy/Terms/Help URLs must be supplied through application metadata.

## Verification

Executed on 2026-11-16:

- TypeScript application/spec checks and production build passed. Production isolation scanned 36 JavaScript assets and found no development showcase/auth fixtures. Existing optional-chain and ExcelJS CommonJS warnings remain.
- All 196 unit/component/service tests passed with Chrome outside the restricted Windows sandbox. The sandboxed launcher failed before running tests; it is not counted as a test pass. The final successful suite also emitted a Chrome shutdown warning.
- All 11 showcase browser cases passed in a final run without snapshot updates (55.8 seconds), including 20 light/dark phone/desktop snapshots, WCAG 2.2 AA axe checks in each section, keyboard focus return, confirmations, local file readiness, successful save/dirty clearing, drawer/tab discard, actual export download and permission denial.
- The full existing browser suite was executed with screenshot comparison disabled: 110 of 113 initially passed. Two catalog axe failures exposed overlap from the first placement of the new showcase link; moving it into the existing heading row resolved all four catalog accessibility/reflow cases. The wizard navigation test passed on isolated rerun. Thus all 113 distinct existing browser cases passed functionally across the full run and those targeted rechecks.
- A separate 27-case visual/reference/focus/footer replay passed 24 initially. The toast-over-drawer case passed after the catalog heading correction, without changing its committed baseline. Two remaining visual cases fail on isolated recheck: auth.spec.ts profile text layout differs (13,030 pixels), and feedback.spec.ts wizard width is 1351px versus a 1366px baseline. Their feature source and existing expected images remain unchanged. These are reported gaps; the entire repository visual suite is not claimed green.
- Workflow and employee-list before/after captures have identical SHA-256 hashes. Profile has volatile sign-in timestamp text. Generated phase6 comparison outputs from the broad test run were restored to the original committed content.
- git diff --check passed. No business-page migration, public API break, new dependency, commit, push or merge.

The isolated section captures use a tall viewport after the normal-height responsive/axe check, so the fixed application footer cannot cover long content. Form action positioning is neutralized only for those captures. Actual pinned-toolbar behavior remains exercised at normal viewport size by Part 4.

## Autocomplete and form-design follow-up

The requested follow-up promotes the existing autocomplete to the first card in Forms and unsaved changes. Single and multiple searchable examples use twelve synthetic people, two-character filtering, wildcard browse, five-result paging, keyboard selection and removable chips. The shared autocomplete now has a decorative search icon while retaining its labelled Clear action and existing API/provider behavior.

The example form now has three described sections, full-width name/description fields, paired count/role and date controls, and the existing dirty/save footer. Shared errors use compact icon-and-text feedback below fields rather than filled error strips. All error colors, spacing and typography use existing tokens. Submit/change timing and accessible relationships remain intact; the reference reason dialog keeps text-only errors.

Verification: 26 relevant browser cases passed without snapshot updates (showcase, component library and Part 3 dirty/selection behavior), including 24 showcase snapshots. 197 unit tests passed; application/spec type checks, production build and isolation of 38 emitted assets passed. Browser coverage includes dedicated search/paging/keyboard/chip removal and validation-correction tests, plus normal/invalid form screenshots in phone/desktop light/dark with axe checks. Existing form-control/action snapshots were refreshed to the current contained layout and the shared search affordance. No business-page source changes or commits/pushes.

## Fixed footer and advanced-grid follow-up

The user explicitly requested an always-visible footer at all viewport widths. AdminShell now reserves footer/header space in a viewport-height column on phones as well as desktops. Main is the only page-content scroller and establishes a positioning context: absolute screen-reader labels in long forms previously escaped to the document and created a second body scrollbar. They remain accessible and now stay inside the content region. Sidebar and grid row/horizontal scrolling remain intentional scoped scrollers.

The new Advanced data grid tab composes the existing SmartDataGridComponent with a bounded, development-only 1,000-employee fixture and a shared details drawer. Search, filters, sorting, selection, column preferences, paging and export use existing grid implementations. User-scoped preferences and production exclusion are preserved.

Verification: 198 unit tests passed. Type checking, production build and the 38-asset production-isolation scan passed, including the new grid-demo marker. Thirty relevant browser cases passed across the regression run and the targeted toast/drawer baseline recheck: 29 passed initially; the remaining screenshot reflected the authorized shell scroll correction and passed after review/update. New checks assert a stationary visible footer, no document overflow, reachable content and mobile navigation at 390/768/1672px, plus grid search/paging/details and responsive axe checks. Twenty-eight showcase snapshots and three fixed-footer screenshots cover the updated page. The toast-over-drawer baseline was reviewed for the corrected shell. No business-page source changes, new dependencies, commit or push.
