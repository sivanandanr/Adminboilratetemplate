# Progress add-on — Step 0 plan

2026-11-15. Audit and plan only. The main UI patterns are not fully implemented; honor the add-on's instruction to implement it after the main work is completed and committed. Nothing here starts Parts A–D.

## What exists today

- No BlockUi service, `blockUi.run`, automatic progress interceptor, offline retry banner or persistent tasks panel was found. `SmartLoadingOverlay` in `shared/ui/display.ts` blocks only its projected content.
- `core/feedback/progress.service.ts` provides root ProgressService operation signals and router-only RouteProgress. `shared/ui/progress.ts` already contains the sole SmartProgressBar, spinner, operation list and route wrapper. Extend this bar, retaining existing status names/API.
- Angular HttpClient is configured in `app.config.ts` with ErrorPresentationInterceptor, AuthInterceptor and development interceptors. Providers perform HTTP; generic UI controls do not. Same-origin API requests have credentials/XSRF, correlation and a 10s timeout; selected GET/HEAD failures retry once. Errors are mapped to safe ApiError text. Global error presentation is currently opt-in.
- HTTP providers include auth, notifications, dashboard, records, server grid and backend export jobs. Grid search uses POST for a read. Development memory providers bypass HTTP; grid's mock interceptor exercises HTTP.
- `shared/grid/export-jobs.ts` already has a backend adapter for start/status/cancel/download, a component-scoped polling lifecycle and a shared ProgressBar. It lacks generic task discovery/reload/retry and route-independent client state. Adapt it rather than creating another export implementation.
- Root app hosts global feedback once. Existing SessionService handles idle and server expiry but has no blocking-save activity link. Background tasks must remain separate from session activity.

## Proposed changes and files, after main work and approval

1. Extend `shared/ui/progress.ts` and specs for 8px token-based state fills, counts/ETA, lower metadata line and correct indeterminate ARIA. Keep percentage/text/cancellable and running/success/error/cancelled APIs; add completed/failed aliases. Preserve global reduced-motion behavior.
2. Add `shared/ui/block-ui.ts` and specs, built on SmartModal and SmartProgressBar, with shared reference-counted request ownership, 300ms delay, 400ms minimum visibility, 8s message and no dismissal. Expose `run(title, fn, {steps})` plus internal request handles. Use real transport bytes or explicit completed steps only, otherwise indeterminate. Extend `core/feedback/progress.service.ts` only where shared state belongs there; do not create a second progress renderer.
3. Add request context/options and progress interceptor next to `core/feedback/error-presenter.ts`; register in `app.config.ts`. Default API writes block, GET reads use route/data loading, blockUi false opts out and true opts in. Explicitly classify POST search as a read and background status/auth housekeeping as non-blocking. Track HttpEvent upload/download bytes only with valid totals; verify backend transport can report progress before advertising real upload percentages.
4. Extend existing error presentation so one failure produces one safe toast and request handles always finalize on success/error/timeout/unsubscription. Retain auth/XSRF/10s timeout and GET retry policy. Do not show raw server exceptions. Timeout user copy follows prompt; reconcile sanitized user-facing message contract with backend providers.
5. Add `shared/ui/tasks.ts` and panel/specs, root service with task adapter, confirmed Cancel through DialogService, Download/Retry actions, completion/failure toasts, minimization and terminal clearing. Extend/adapt `shared/grid/export-jobs.ts` and its tests; keep server jobs separate from cancel-on-route foreground operations. Need backend task list/reload/retry contracts for refresh recovery; do not fake these capabilities.
6. Integrate one progress dialog/loading indicator/tasks panel into existing app/shell outlet ownership, using semantic stacking tokens in `src/design/tokens.css`. Coordinate native dialog top-layer behavior with auth/idle and toasts. Extend `core/auth/session.service.ts` for foreground save activity only, respecting server expiry. Export new APIs through `shared/ui/index.ts`.
7. Extend `/ui-patterns` after it exists, docs `ui-patterns.md`, component/service specs, HTTP tests and Playwright/axe/visual tests. Keep page edits limited to replacing duplicate mechanics and demo composition.

## Compatibility for `blockUi.run`

There are no existing source callers to migrate. Once introduced by the main work, preserve the same signature, return/rejection behavior and cleanup semantics. Manual `run` and interceptor requests must acquire handles in the same service and render one dialog, including nested/concurrent operations; closing waits for the final handle and minimum display interval. Explicit request context can suppress redundant ownership where needed without suppressing the manual wrapper. Never create one dialog per request or a second add-on service. Add regression tests for manual-plus-HTTP overlap, late calls during minimum visibility and thrown/rejected/cancelled work.

## Checks required later

Test default writes/reads, explicit opt-in/out, POST reads, concurrent calls, retries, cancellation, 300/400ms timing, slow message, safe timeout/error toast once, real/steps/unknown progress and reduced motion. Test task lifecycle, confirmation, downloads/retries, navigation persistence and backend refresh recovery once available. Verify blocking-save/idle interaction and background polling separation. Build, typecheck and execute unit/browser checks; compare existing screens before/after. None of these runtime checks has been executed for this documentation-only Step 0.

Stop: no add-on implementation, dependency changes or application changes were made.
