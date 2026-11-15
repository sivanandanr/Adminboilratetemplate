# SmartIAM frontend architecture

The existing Angular project is retained: Angular 20 standalone components, zoneless change detection, strict TypeScript, Signals for view state, RxJS for cancellable asynchronous work, typed Reactive Forms, OnPush, Tailwind v4 and centralized CSS variables. No new runtime dependency was added in Phase 6.

## Boundaries

| Location | Responsibility |
| --- | --- |
| `core/auth` | Auth facade, secure-session adapter contract, guards, permission state, cross-tab idle/logout coordination, HTTP and safe redirects |
| `core/feedback`, `core/notifications` | Shared confirmation/toast/progress/error services, automatic HTTP feedback, connection recovery, root background-task monitoring and notification provider/store |
| `layout` | Responsive shell, nested navigation, breadcrumbs, theme and header disclosures |
| `shared/ui` | Typed controls, modal/drawer, tabs, wizard, state and display primitives |
| `shared/grid` | Community grid wrapper, client/server adapters, preferences, safe CSV/XLSX and export-provider adapters into the shared task lifecycle |
| `shared/dashboard` | Business-independent widget contract/registry/renderer and validated API dashboard adapter |
| `shared/templates` | Typed administration page frame, action projection and loading/empty/error/retry states |
| `features/dashboard` | Role selection, permission-filtered widgets, provider orchestration and refresh |
| `features/records` | Resource-specific route metadata, column/export policy, paginated lists, details, forms, configuration, request wizard and approval decisions |
| `features/administration` | Existing UI-246 administration composition, retained rather than duplicated |
| `features/dev` | Existing interactive examples, integrated catalog and isolated memory fixture providers |

## Composition and provider choices

Features compose the existing KPI card, controls, grid, tabs, wizard and feedback services. `AdminPageTemplate` centralizes page hierarchy/states; its `kind` identifies the composition, not an inheritance hierarchy. The records feature owns resource rules; generic components do not call employee APIs. `DashboardWidgetComponent` renders a typed widget kind without IAM-specific rules.

Injection tokens `DASHBOARD_PROVIDER` and `RECORDS_PROVIDER` separate transport from presentation. Production environment factories select `ApiDashboardProvider` and `ApiRecordsProvider`. Angular's development file replacement selects isolated mock providers. This adapter boundary is necessary to exercise complete frontend flows without inventing a deployed backend. It follows the existing auth/notification provider approach.

`RoleDashboard` uses switchMap to cancel obsolete role/refresh reads and toSignal for lifetime cleanup. `GridController` already owns page request cancellation, deduplication and stale response fencing. Record reads use route-param Signals and switchMap; saves use scoped destruction cleanup. Changes are acknowledged by the provider before success feedback. Mutations are not retried automatically. The shared wizard handles dirty navigation and submission lifecycle; forms reuse the same confirmation service.

Routes lazy-load feature components; configuration and create/edit forms use `UnsavedChangesGuard`. Explicit static destinations precede parameterized details so paths such as `/identity/lifecycle` are not misinterpreted as record IDs. Route metadata drives breadcrumbs. Permissions are enforced in guards and presentation; backend resource/field/ownership checks remain mandatory.

## State, persistence and lifecycle

Authentication sessions/tokens are never put in browser storage. The existing optional username preference, theme, non-sensitive column layout/page size and tab coordination are the only relevant browser preferences. Phase 6 records, request drafts and mock decisions are memory-only. Reload resets the development session and fixtures. Dashboard refresh is explicit; there is no dashboard polling timer. Part 2 export-job monitoring is owned by root TaskService, survives component/route destruction and stops at terminal state or identity/service teardown. Server jobs are never cancelled merely because monitoring stops. Refresh recovery needs the configured server task list; no task payloads are persisted in browser storage.

Part 2 composes the one SmartProgressBar into blocking, inline, task and 3px read/navigation displays. BlockUiService shares delayed/minimum-visible foreground presentation across requests/manual operations; modal priorities allow a saving dialog to preempt and later resume a form without losing the original focus target. Request context marks POST searches as reads and excludes polling/renewal from foreground activity. The connectivity banner retries a safe session GET, never replays writes. The existing session engine counts visible foreground work as activity while preserving authoritative server expiry. Generic upload controls consume typed progress and emit cancellation; providers own transport and backend acknowledgement. See [UI patterns](ui-patterns.md) and [task contract](BACKGROUND_TASK_CONTRACT.md).

The catalog reuses the original examples conditionally, rather than mounting every complex example at once. Large grids retain row virtualization and supply only the loaded page. Role data and API response arrays are bounded. This is a frontend architecture review, not a heap-profiler proof of leak freedom; long-running browser and backend load profiling remain integration work.


### Registered form lifecycle (Part 3)

`shared/ui/forms.ts` supplies SmartForm. Its submit/change validation context is consumed by the common value accessor; all field labels/help/errors/disabled reasons come from SmartFormField. Legacy touch validation remains available while pages await the scoped Part 6 migration. Multi-select composes autocomplete rather than maintaining a second search/listbox implementation.

`core/feedback/dirty-forms.service.ts` owns the registry and the single conditional beforeunload listener. Per-form trackers subscribe to AbstractControl events and are disposed with their component. Save completion is fenced against newer value changes; no form payload is serialized into registry/browser storage. The reusable dirty-form guard uses the existing DialogService, preserving the old UnsavedAware callback/export. Action footers accept a tracker or SmartForm and emit close only after confirmation. AuthFacade confirms voluntary dirty logout and synchronously clears dirty warnings for security invalidation; expiry bypasses any pending voluntary confirmation.


### Shell scroll and container ownership (Part 4)

Desktop AdminShell owns a fixed viewport with one main scroller and a separate footer, while mobile retains document scrolling. The sidebar keeps its own overflow. Root feedback ownership is unchanged and remains singular for authenticated and authentication routes. AppMetadata is a typed deployment override for footer product/version/environment and approved links. Visible footer height is exposed as a semantic offset for floating tasks.

Drawer composes the same queued SmartModal implementation; confirmations preempt/resume it rather than creating an independent trap. ModalScrollLock includes the new main scroller. Tabs/drawers consume scoped registered form trackers, while the controlled parent retains ownership of its domain reset/load operations. Semantic status badges and risk mappings have one implementation with adapters for existing APIs. AG Grid retains its row/header/x-scroll ownership; the shared card owns the pinned pager. SmartTable provides a native-table counterpart used by shared dashboard charts.
