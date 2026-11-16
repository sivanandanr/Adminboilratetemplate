# UI patterns — Step 0 plan

2026-11-15. Planning only; implementation has not started. Detailed per-file findings are in [ui-components-audit.md](ui-components-audit.md).

## Existing foundation

- Angular 20 standalone, zoneless, OnPush, strict TypeScript, Signals/RxJS and typed Reactive Forms; Tailwind v4; custom SmartIAM controls; AG Grid Community; ExcelJS; Lucide Angular icons through `shared/icon.ts`.
- Theme source: `src/design/tokens.css`; global primitives: `src/styles.css`; shared controls: `src/app/shared/ui/ui.css`; theme selection: `src/app/layout/theme.service.ts`.
- Keep `--iam-font-family` (Arial/Helvetica), `--iam-surface`, `--iam-canvas`, `--iam-primary`/`--iam-accent`, `--iam-text`, `--iam-text-secondary`, border/focus/backdrop, status fills/text, spacing, radius and shadow tokens. No new palette or fonts.
- Reuse Button (`shared/button.ts`, `ui/actions.ts`), Badge/StatusIndicator (`ui/display.ts`), SmartModal and DialogService, SmartGridPagination (`shared/grid/grid-controls.ts`), SmartTabs and sole SmartProgressBar. Existing tabs are underlined, despite the prompt assuming pills; retain the existing style.
- Root `app.html` already mounts auth dialogs, dialog host, toast container and route progress once. SessionService and SessionChannel already implement configurable 15m/60s idle handling and tab coordination. Extend them.

## Smallest complete implementation sequence, after approval

1. Extend shared buttons, modal structure, queued dialogs and toast timing/accessibility; add StatusBadge compatibility mapping through existing Badge. Keep current APIs as adapters where the requested API differs.
2. Add BlockUi service/dialog composed from SmartModal and SmartProgressBar; extend route/data loading and add a single offline banner. Follow [ui-patterns-addon-plan.md](ui-patterns-addon-plan.md) for the subsequent automatic HTTP/task integration.
3. Add shared dirty-form/submission tracking, dynamic beforeunload registration and a router adapter reusing UnsavedChangesGuard. Add footer dirty/Cancel/Close composition and guarded tab/drawer transitions. Extend common field behavior rather than putting mechanics into pages.
4. Extend existing session service and replace AuthDialogs' separate modal mechanics with shared modal/bar. Add requested idle message/countdown/focus and dirty-loss notice. Logout still uses AuthFacade; authoritative server expiry remains enforced.
5. Add app footer, constrained content scrolling, pinned card pagers/form footers and semantic layering. Keep existing mobile navigation and all unrelated layout styling.
6. Only then remove duplicated page mechanics listed in the audit, add `/ui-patterns` via shared components, update docs/examples, and run validation.

New pieces use the existing surface/border/radius/shadow tokens; toast/status/idle/progress states use existing semantic status tokens. New layer tokens express ordering only. Background tasks compose the same progress/status/dialog primitives rather than new visual controls. No new UI library is planned.

## Expected files

- Extend: `src/app/shared/button.ts`; audited `shared/ui` controls and specs as needed, especially actions/modal/dialogs/toast/progress/display/form-field/value-accessor/tabs/drawer/wizard and `ui.css`/`index.ts`.
- Extend services: `core/feedback/{dialog.service,toast.service,progress.service,error-presenter}.ts`; `core/auth/{session.service,auth-dialogs,auth.facade}.ts` and existing session/config/channel tests as needed.
- Add: `shared/ui/{block-ui,offline-banner,forms,tasks}.ts` and specs; request-feedback interceptor/context near existing HTTP interceptors; router-facing dirty guard adapter. Re-export new public services/components from `ui/index.ts`.
- Integrate: `app.{ts,html,config.ts}`, `app.routes.ts`, `layout/admin-shell.{ts,html,css}`, shared grid card/pager layout, `src/design/tokens.css` for layers only, environment/app metadata config for version/environment/footer links.
- Final pass only: page files enumerated in audit; development `/ui-patterns` composition, route and catalog examples; `docs/ui-patterns.md`; component/service specs and Playwright behavior/visual/axe tests.

No existing styles are changed by Step 0. Future implementation will preserve existing font/palette/header/sidebar/card/button/tab styling, with only explicitly requested new variants, state presentation and sticky/scroll changes. Toast surface, progress height and password/validation behavior differences are explicitly recorded in the audit; broad visual equivalence is not claimed in advance.

## Verification after implementation

Capture three existing pages before changes, including a list page and Workflow Management if an implemented route is available; document missing route rather than substituting an image for a running page. Compare after screenshots, including phone widths, dark theme and reduced motion. Test keyboard focus/trapping/return, dialog result aliases, toast limits/timing/resume, dirty lifecycle/guard, idle sync/save activity, and progress/request lifecycle. Run build, typecheck, relevant unit/integration tests and Playwright/axe checks, then report actual results and backend gaps.

Stop: this is the main prompt's Step 0 deliverable only, pending approval.
