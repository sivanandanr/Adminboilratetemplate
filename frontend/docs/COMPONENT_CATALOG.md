# Integrated component catalog

`/dev/components` is the existing protected component route, now extended with an enterprise category navigator. The original form/button/display examples and per-component usage remain below it. Categories conditionally instantiate the existing examples rather than duplicate the controls or load every demonstration simultaneously.

| Category | Interactive content and API | Accessibility/state notes |
| --- | --- | --- |
| Navigation/layout | Actual shell, SmartPageHeader, SmartBreadcrumb, SmartDrawer, tabs and accordion | Keyboard groups, focus return, responsive drawer; existing layout examples below catalog |
| Buttons | SmartButton, groups, split button and toolbar | Native disabled/busy semantics; variants and loading examples in original showcase |
| Forms | Textbox, password, textarea, number, checkbox, radio, toggle, form section/error | Typed CVAs; common state explorer supports required/disabled/read-only/error/loading |
| Autocomplete/selection | Dropdown, multi-select, local/remote autocomplete | Keyboard selection, cancellable async query, paging/errors; selected model value also works when options arrive later |
| Date controls | Date/date-range picker, date validation | Labeled native controls, keyboard and invalid range feedback |
| Dialogs | Existing FeedbackShowcase + ConfirmationService | Required reason/text, focus containment, dismissal/cancellation, failure/retry |
| Toasts | Existing FeedbackShowcase + ToastService | Variants, actions, auto-dismiss, live announcement and pause/resume |
| Notifications | Existing NotificationsShowcase + provider/store | Read/unread/categories/page/error/empty/loading, independent fixture provider |
| Progress indicators | Existing FeedbackShowcase + ProgressService | Determinate/indeterminate, cancel/error/completed, no fabricated percentage |
| Wizards | Existing WizardShowcase + WizardConfiguration | Validation, draft, review, submission/failure/dirty navigation and orientation |
| Data grids | Existing GridShowcase + SmartDataGridComponent | Page-only selection, keyboard cells, columns/preferences and safe exports; links to dedicated server/export examples remain in grid guide |
| Dashboard widgets | Widget state explorer + `/dashboard` all kinds/profiles | Typed registry, trend/status/list/chart semantics, retry and table alternative |
| Administration templates | Kind/state explorer + links to all ten actual page examples | Actions, breadcrumbs, permission-aware states and responsive compositions |

Every category displays API notes, accessibility guidance and token references in the application. Existing [Phase 3 APIs](PHASE_3_COMPONENTS.md), [Phase 4 feedback APIs](PHASE_4_FEEDBACK.md), [grid APIs](PHASE_5_GRID.md), [widget APIs](DASHBOARD_GUIDE.md) and [template APIs](ADMINISTRATION_TEMPLATES.md) provide detailed signatures and usage. Disabled/error/loading apply where meaningful: static badges/dividers do not pretend to submit/load; their containing page supplies asynchronous states.

Palette and geometry come from `src/design/tokens.css`, the [token evidence register](design/DESIGN_TOKENS.md) and approved references. Hover/focus, dark/mobile geometry and newly combined layouts remain documented provisional behavior. Native controls and Lucide approximate screenshot artwork; no proprietary UI library was introduced.

The route requires `showcase.view` and is excluded through production environment route replacement. The production bundle scan checks implementation markers. The public administration samples are real feature routes and use production API adapters, not developer providers, in a production build.
