# Shell verification — 15 November 2026

This records the earlier initial shell. Current Phase 1B features and verification are documented in [PHASE_1B.md](PHASE_1B.md).

## Executed checks

- Production `npm run build`: passes; initial bundle approximately 233.62 kB raw / 64.80 kB estimated transfer, within starter budgets. Shell and feature pages are separate lazy chunks.
- `npm run typecheck`: application and spec TypeScript pass.
- `npm run test:unit`: five tests cover application outlet creation, desktop collapse/expand, mobile Escape behavior and decorative icon rendering.
- `npm run test:e2e`: ten Playwright tests cover lazy navigation, deep links/reload/history, active route state, keyboard collapse, mobile focus containment/restoration, mobile route dismissal and responsive reflow.
- Axe checks target WCAG A/AA tags through WCAG 2.2 at widths 320, 390, 768 and 1672, plus the open mobile drawer. Automated checks do not establish full WCAG conformance or replace screen-reader evaluation.
- Three implementation snapshots: desktop (1672 × 941 viewport), collapsed desktop and mobile (390 × 844 viewport). Baselines were created, visually inspected and compared in a subsequent run. Browser font rendering/snapshot baselines are platform dependent.

## Visual review against references

Compared the rendered desktop, collapsed and mobile images with UI-246, with UI-181/UI-037 used for visual context. Sidebar width is 274 px, matching the primary reference's approximate boundary; rendered main content begins at x=298 versus approximately x=291 in UI-246. The 56 px header and 24 px content padding produce a lower page heading. The palette preserves sampled navy, lavender and purple. Flat surfaces replace raster gradients. The font fallback, provisional shield, glyph substitutions and uniform tile tint remain visible differences.

UI-246's KPI row, data grid, activity and health panels are not implemented in this shell phase. The landing page has working configuration links and an explicit disconnected-service notice. Navigation retains reference module order but future modules use placeholder pages. Desktop navigation scrolls when it exceeds available viewport height. Mobile/collapsed designs have no supplied dedicated reference and remain provisional. No screenshot equality or pixel-perfect claim is made.

## Security and remaining gaps

The implementation introduces no credentials, browser token storage, API calls, unsafe HTML or data mutations. Route metadata is local and typed; routes are not authorization boundaries. Real authorization, secure sessions and server validation remain future integration work. Export and formula-injection handling are deferred with the export phase.

The starter has no lint configuration, so lint validation was not available; TypeScript validation was executed separately. Full manual screen-reader review, backend integration, authenticated UI, dedicated grid/form functionality and dedicated mobile design approval remain outstanding. Dependency installation reported 16 moderate advisories and a `lucide-angular` deprecation notice recommending `@lucide/angular`; dependency remediation was not performed in this design/shell task. The advisories are not evidence of an exploitable shell defect, but require dependency review before production release.

An initial icon spec failed because its test injector lacked zoneless setup; corrected. A sandboxed Chrome attempt could not start its GPU process; the same tests ran successfully with approved browser access. Playwright initially found focus restoration occurring while the workspace was still inert; focus now restores after render, and the navigation test passes.
