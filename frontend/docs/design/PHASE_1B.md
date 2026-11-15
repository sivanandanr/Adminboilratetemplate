# SmartIAM Phase 1B — Administration shell

The application extends the existing Angular 20 project; it was not recreated. UI-246 is the primary light-theme reference, following the Phase 1A analysis, manifest and token register. Start with `npm start` from `frontend` and open `/administration` (or `/dashboard`). On PowerShell systems that block npm.ps1, use `npm.cmd start`.

## Implemented behavior

| Requirement | Implementation |
| --- | --- |
| Responsive header | Contextual breadcrumbs, local page search, theme switch, notification bell and mock profile disclosure. Desktop search supports Ctrl/Cmd+K. |
| Expand/collapse navigation | Desktop icon rail and expandable nested groups; clicking a group from the collapsed rail expands it. Active children and their parent group are highlighted. |
| Nested icon menus | UI-246 module order with typed group/item metadata and child outline icons. All 33 nested destinations resolve; unimplemented business features say they are placeholders. |
| Breadcrumb navigation | Route metadata supplies parent links and a current-location label. Deep links, reload and browser history update context; later route changes focus main content. |
| Page headings/actions | Shared heading composition; Create Configuration at the upper right routes to its placeholder. System Actions opens working mock-preview actions. |
| Notifications / My Profile | Accessible disclosure controls, outside-click/Escape dismissal, focus restoration, and working placeholder routes. No authenticated user or unread count is asserted. |
| Light/dark infrastructure | A typed root service uses a Signal and semantic CSS overrides. Light is the default. Theme survives in-app navigation; it deliberately resets on reload and stores no account/token data. |
| Mock dashboard | Six reusable KPI cards, configuration links, a searchable read-only role summary, sample activity and explicitly simulated health. All fixture values are labelled mock/sample. |
| Loading/empty/error | An isolated asynchronous mock adapter and feature facade expose a discriminated state union. System Actions can preview empty/error states and restore fixtures. New requests cancel obsolete loads; destruction cancels outstanding work. |
| Mobile drawer | Overlay dismissal, Escape, focus containment, background inertness/scroll lock, route-change dismissal, and resize cleanup. Opening the mobile drawer restores full navigation even after desktop collapse. |

The top search finds sidebar page names, not users/accounts/backend records. Notification/profile controls intentionally have no API integration. No login, logout, session handling, permissions enforcement or user mutations were added.

## Architecture and reusable APIs

- Standalone components use OnPush. The existing `provideZonelessChangeDetection()` configuration remains in place. Signals manage synchronous UI state; RxJS handles route events and cancellable mock loads.
- `layout/` owns navigation metadata, shell, header behavior and theme state. Feature routes/pages load lazily. `features/administration/` contains the dashboard facade/adapter, composition and separate role-summary/activity-health components.
- `shared/` contains typed `Icon`, `Button`, `PageHeader`, `KpiCard` and `FeedbackState` primitives. They contain no backend or business-service calls. Role/activity models stay in the feature.
- The facade coordinates feature resource state; the adapter isolates mock data for replacement with an API provider. These patterns address actual orchestration/integration boundaries; no factory or inheritance hierarchy is introduced.
- Tailwind v4/PostCSS and Lucide remain the existing styling/icon stack. No PrimeNG, KendoUI, Angular Material or new major dependency was added.

Examples (the consuming standalone component imports the referenced primitives):

```html
<button iamButton variant="primary" [loading]="saving()" [disabled]="unavailable()">
  Save changes
</button>

<iam-page-header title="Administration" description="Manage the platform." icon="Settings">
  <a page-actions class="button button-primary" routerLink="/administration/system">Configure</a>
</iam-page-header>

<iam-kpi-card [metric]="metric" [loading]="loading()" />
<iam-feedback-state kind="error" title="Unavailable" description="Try again."
  actionLabel="Retry" (retry)="reload()" />
```

`KpiMetric` requires label, formatted value, detail, a typed icon name and a typed tone. Cards are read-only, so they do not invent disabled/click semantics; resource errors/empty states belong to the parent feedback component. `Button` preserves native button semantics and disables activation while busy. `PageHeader` accepts typed title/description/icon inputs and projects contextual actions. `FeedbackState` supports loading/empty/error and a typed retry output; loading uses status/busy semantics and errors use an alert. `Icon` is decorative and its enclosing control must have an accessible name.

## Color provenance and implementation choices

`src/design/tokens.css` is the palette source. The light canvas `#F4F2FD`, sidebar `#000D2B`, actual header `#F5F4FE`, panel `#FBFAFE`, primary `#6502FC`, panel border `#E4E4FA` and control border `#D7DCFE` use the Phase 1A samples. The incorrect earlier provisional header mapping was replaced. Generic Tailwind palette colors were not substituted.

Additional original UI-246 measurements were made in Phase 1B to retain category tile differences:

| Role | Exact raster sample / region | Normalized token |
| --- | --- | --- |
| System tile backing | (700,350) | `#EDF6FE` |
| Notification tile backing | (1000,350) | `#FEF0F0` |
| Audit tile backing | (1250,350) | `#EFF7F4` |
| Scheduler tile backing | (1500,350) | `#F2EDFE` |
| System icon | (590,292)-(623,333): `#0056F6` occurs twice among saturated blue pixels (B>170, R<60, G<150), tied | `#0056F6` |
| Notification icon | (870,290)-(905,332): `#FC4000` occurs twice among orange pixels (R>180, 60<G<170, B<70), tied | `#FC4000` |
| Audit icon | (1140,290)-(1180,334): `#067B21` occurs twice among green pixels (80<G<180, R<60, B<60), tied | `#067B21` |

These are exact observations of pixels; using them as uniform fills/accents is provisional. The tiny icon samples are low confidence and do not recover the original SVG stroke colors. Status/text candidates and white-on-primary reuse retain the M/E/P limitations in `DESIGN_TOKENS.md`. Colored glyphs are decorative alongside labels; color is not their sole information channel.

The user requested dark-theme infrastructure. It is implemented as a separately documented provisional mapping rather than mixing a dark screenshot into the light baseline. Original UI-094 samples: header `(500,20)` = `#0E1627`; canvas `(1000,130)` = `#141D33`; panel sample `(248,210)` = `#19213F`; control `(800,360)` = `#141B2E`; section `(1000,290)` = `#1D2541`. A pale glyph sample `(1605,110)` = `#C7ACFC` is provisionally reused for readable dark-mode accents. White text reuse, mixed border opacity and consistent purple buttons are design decisions, not a claim that the entire dark UI-094 has been reconstructed.

Font family/metrics, flattened gradients, focus/hover behavior, shadow opacity, the 68 px collapsed rail and responsive breakpoints remain provisional. The implemented shadow is explicitly a modest approximation. Source geometry is estimated, not verified source CSS; this distinction is preserved rather than claiming exact recovered spacing.

The two dashboard page actions use the source's estimated 238 px / 200 px widths and 16 px gap at the reference viewport (primary x≈1202, secondary x≈1456, right edge x≈1656), with wrapping on narrow layouts. The near-white secondary-button fill uses the separate UI-246 `(1500,110)` sample `#FCFBFE`, rather than conflating it with input fill.

## Screenshot comparison and discrepancies

Desktop light, desktop collapsed, desktop dark, mobile light and open-mobile-drawer snapshots are stored under `e2e/shell.spec.ts-snapshots/`. They are implementation regression baselines. The light desktop was visually compared with original UI-246 at a 1672 x 941 viewport. Original source colors were sampled without resizing. Screenshot equality is not claimed.

Five same-coordinate source/render checkpoints were also compared with `Bitmap.GetPixel`: `(8,400)` sidebar `#000D2B`, `(280,55)` canvas `#F4F2FD`, `(900,20)` header `#F5F4FE`, `(800,260)` panel `#FBFAFE`, and `(1210,90)` primary button `#6502FC`. All five match exactly in the final light snapshot. This verifies those selected flat-color samples only; it does not establish whole-region or whole-screen equivalence.

Measured browser layout from the visual test (rounded; the JSON artifact is under `test-results/`):

| Region | Rendered | UI-246 observation | Difference |
| --- | --- | --- | --- |
| Sidebar | 274 px wide | Boundary around x=274 | Matches the estimated boundary. |
| Header | x=274, height 50 | Boundary around y=49 | About 1 px taller. |
| Main panel left edge | x=290 | About x=291 | About 1 px left. |
| Heading/icon row | y=62, height 56 | Icon about y=62–118 | Aligns with the estimated icon region; font/glyph shapes differ. |
| KPI row | y=134, height about 96 | About y=136, height 88 | Starts about 2 px higher and is about 8 px taller due to fallback typography/wrapping. |
| Configuration panel | y≈246, height≈135 | About y=239, height≈131 | About 7 px lower and 4 px taller. |
| Lower panels | y≈397 | About y=385 | About 12 px lower; contents differ as described below. |

Remaining discrepancies/incomplete features:

1. The source font and official logo asset are unavailable. Arial/Helvetica and a Lucide shield are provisional; they are not the approved logo/font. Outline glyph shapes, weights and some category icon hues are approximations from raster samples.
2. UI-246's lower tab strip, type/status selects, checkbox selection, row edit/copy/menu actions and pagination are not implemented as enterprise grid features. The dashboard uses a six-row read-only semantic summary table with working local search. AG Grid, exports and mutation workflows remain later phases.
3. Mock labels, sample timestamps, System Actions preview options and the health disclaimer add content absent from the original. Health/activity are fixtures, not monitored systems. Their panels and the total page can be taller than the reference. Read-only View Roles replaces Create Role because role creation is not implemented.
4. The header adds a theme toggle and a demo-profile label, omits the reference's help/settings/app-launcher group, and provides local page search instead of global data search. Notification and profile content are placeholders.
5. Child icons are added to satisfy the requested icon-based nested navigation; the reference often uses text-only children. Parent chevrons use the same Lucide treatment. Children outside Administration are catalogue-supported placeholder destinations, not implemented business modules.
6. Dark mode, mobile behavior, focus management, interaction states, collapsed navigation and normalization of gradients/shadows need dedicated design approval or more references before fidelity can be established. Theme selection is in-memory only.
7. Authentication/session/profile editing, backend authorization, real notifications, API integration, server validation and production data access remain incomplete. No mock authentication or fabricated backend success is introduced. API requests/tokens/exports do not exist in this phase.
8. Full manual screen-reader evaluation and exact visual matching remain outstanding. Automated axe checks and keyboard tests are useful evidence, not full WCAG conformance. The starter has no lint configuration; strict TypeScript checks are executed, but are not a substitute for linting.
9. The earlier dependency-install result reported 16 moderate advisories and deprecation of `lucide-angular` in favor of `@lucide/angular`. No dependency upgrade/remediation was attempted in this shell phase; review is still needed before production use.

## Verification

Commands run from `frontend`:

```text
npm.cmd run build
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:visual:update
npm.cmd run test:e2e
npm.cmd run test:e2e -- --grep "visual regression"
```

The production build and strict application/spec type checks pass within the existing bundle/style budgets, without raising the budgets. The final initial bundle is 250.55 kB raw / 68.69 kB estimated transfer; shell and feature pages remain lazy chunks. Ten unit/component tests cover shell collapse/mobile Escape, the application outlet, decorative icons, busy buttons, metric loading, feedback retry, resource-state recovery, stale-request cancellation and teardown.

Twenty Playwright tests pass, covering nested destinations, active state, route history/deep links, breadcrumb context, page search, contextual actions, loading/empty/error recovery, role filtering, notification/profile disclosures, theme changes, mobile focus/background behavior, responsive reflow and visual regression. Axe checks cover light widths 320/390/768/1024/1672, dark widths 390/1672 and open mobile/header disclosures. After the final intentional snapshot update, the two ordinary visual-regression tests also pass without updates, comparing all five final images. Screenshot updates alone are not proof of regression stability or source fidelity.

No secrets, browser authentication-token storage, unsafe HTML, real user data, backend calls or administrative mutations were introduced. Routes and mock visibility are not security boundaries. Existing AGENTS instructions, the original PNGs and Phase 1A evidence were retained.
