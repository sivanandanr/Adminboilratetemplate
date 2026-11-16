# Shared UI patterns — Part 1

Implemented scope: actions/Button, modal, dialogs, toast and notification composition. Pages, shell, HTTP progress, tasks, dirty-form tracking and idle handling have not been migrated. All examples import from `src/app/shared/ui/index.ts`, except the existing native `Button` directive at `shared/button.ts`.

## Actions

`SmartButton` preserves its existing inputs/`pressed` output. Variants are `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`, `warning`. `emphasis` is `auto`, `solid` or `outline`: primary/success are solid by default; danger/warning are outlined outside confirmations. A shared button group or action toolbar permits one solid main action. Native directive consumers project their own icon; SmartButton supplies a leading icon when none is specified. Loading retains the label footprint, shows a spinner and prevents repeated activation; reduced motion disables rotation.

```html
<smart-button label="Save changes" icon="CircleCheck" variant="primary"
  [disabled]="!canSave()" disabledReason="Complete the required fields."
  [loading]="saving()" (pressed)="save()" />

<smart-action-toolbar #footer placement="form" [dirty]="dirty()">
  <span actionStatus>Optional status</span>
  <smart-button label="Preview" icon="FileSearch" />
  <smart-button cancelAction [label]="footer.closeLabel()" icon="X" />
  <smart-button primaryAction label="Save changes" icon="CircleCheck" variant="primary" />
</smart-action-toolbar>
```

Use `actionStatus`, `cancelAction`, and `primaryAction` slots for status at the left and secondary / Cancel-or-Close / primary ordering at the right. `dirty` only renders the pill and exposes `closeLabel()`; form tracking belongs to a later part.

`disabledReason` is available on SmartButton and Button. A disabled action with a reason remains focusable with `aria-disabled`, so its shared tooltip can be discovered by keyboard. Click/default submit is suppressed. Without a reason the existing native disabled behavior remains. Supply an actual reason, not sensitive backend details.

For a reusable action that must confirm, supply typed `action="approve|reject|delete|remove|withdraw"`, or a `confirmation` options object. `pressed` is emitted only after confirmation. Semantic intent is explicit rather than guessed from a display label, preserving existing buttons whose handlers already call the shared confirmation service. Do not combine both confirmation approaches on one action. Native button callers continue to use DialogService explicitly. Page-level migration/enforcement is outside Part 1.

## Modal and dialogs

SmartModal retains `title`, `description`, `open`, `closable`, `closed`, and adds `tone`. Default projected content is the independently scrolling body. Put actions in an element with `modalFooter`. The header/footer remain visible and total height is at most 85dvh. Shared modal instances use one FIFO queue; closed/cancelled forms still control their `open` input. Esc/backdrop request cancellation only when closable, focus is trapped/restored and scroll locks are released on destruction.

```html
<smart-modal title="Review change" tone="info" [open]="open()" (closed)="open.set(false)">
  <p>Details to review.</p>
  <div modalFooter><!-- shared action toolbar or existing action buttons --></div>
</smart-modal>
```

`DialogService` and `ConfirmationService` delegate to the same queued modal implementation:

```ts
const result = await dialog.confirmWithReason({
  kind: 'remove', title: 'Remove this assignment?',
  text: 'The server will validate the change.', okLabel: 'Remove',
});
if (result.confirmed) await removeAssignment(result.reason);

await dialog.info({ title: 'Request received', text: 'Processing will continue.' });
```

Existing `confirm`, `message`, `message` option, `primaryLabel`, `{confirmed, reason}`, async `execute`, `typedText`, and `cancellationSafe` remain supported. New aliases are `text`, `okLabel`, `okVariant`; service results also expose `ok`. `confirmWithReason` always requires a nonblank reason (maximum 1,000 characters); errors appear under the field. Safe async failure remains retryable and does not expose raw exceptions. Destructive/unsaved/logout kinds use danger confirmation; approve uses success; withdraw uses warning. Callers retain responsibility for backend authorization and audit persistence.

Ordinary shared modals are serialized; the legacy authentication dialog remains owned by the existing auth implementation until its later integration phase. Legacy projected footers without `modalFooter` remain body content for compatibility; adopt the slot when composing new dialogs.

## Toasts and notifications

```ts
toast.success('Changes saved', 'The server confirmed your update.');
toast.info('Request received');
toast.warning('Review needed', 'Check the highlighted values.');
toast.error('Save failed', 'Try again after checking the connection.');
```

Existing `show`, action, dismiss and dismissAll APIs remain. Up to three messages display at the top right; oldest messages are dismissed when the limit is exceeded. Success/info default to 5 seconds; warning/error default to 9 seconds. Explicit `durationMs` still overrides the default, and zero stays persistent. Hover or focus pauses remaining time; it resumes only after both leave. Non-error messages announce politely; errors use alert/assertive semantics. Message content is rendered as text, never HTML.

`SmartFeedbackIcon` supplies the same four tone/icon/token treatments to toasts, modal headers and notification entries. Notification panel/bell/center retain their store, paging, categories and read/unread actions; they are not transient toasts. The existing global outlets remain where they were; no shell or stacking redesign is part of this change.

Use existing theme tokens and fonts. Dark theme, reduced motion and phone widths are covered by component/browser checks. New snapshots are in `e2e/ui-components-part1.spec.ts-snapshots/`. New appearance uses existing tokens; these snapshots establish a regression baseline rather than claiming pixel equality with illustrative references.

## Verification — 2026-11-15

- `npm run typecheck`: passed (application and spec TypeScript).
- `npm run build`: passed; existing ExcelJS CommonJS optimization warning remains.
- `npm run test:unit`: 122 passed. Includes legacy tooltip-plus-Button composition and capture-phase suppression of native disabled-action handlers. The final Chrome run used an unrestricted test process after a restricted-sandbox GPU launch failure.
- Playwright feedback behavior/accessibility suite excluding its separately run visual case: 11 passed. Includes phone/desktop and light/dark WCAG axe checks, confirmations, modal focus, toasts, notifications and existing wizard integration.
- New Part 1 dialog/toast visual, tall-body scrolling, focus-return, reflow and reduced-motion checks: 4 passed against reviewed snapshots at 390px/1672px in both themes.
- Existing shell/mobile/integrated dashboard/create-form visual cases: 3 passed with no baseline changes. Existing feedback/wizard visual case: 1 passed after reviewing and updating only the expected confirmation, error-toast and notification snapshots; both wizard snapshots remained unchanged.
- `git diff --check`: passed. No feature page, app shell, route, HTTP, auth, theme-token or dependency changes. No push, merge or commit was performed.

These are scoped Part 1 checks, not a claim that every repository e2e test or backend integration was executed. Explicit semantic action options and shared dialog calls provide confirmations; auditing/migrating every page action remains Part 6. Auth-dialog consolidation, toast/modal top-layer integration, automatic server progress, shared dirty tracking and idle integration remain their approved later parts. Part 1 ends here.

## Reference alignment correction — 2026-11-15

The user requested closer alignment with the supplied artwork and explicitly kept this correction to Part 1. See [feedback alignment evidence](design/FEEDBACK_ALIGNMENT.md) for measured colors and estimated geometry.

Toasts now use compact 380px cards, circular check/X tone icons, muted 14px copy and plain dismiss controls. The Dismiss all toolbar has been removed from the outlet; `ToastService.dismissAll()` remains backward compatible. Confirmations use a 460px modal, a trash icon for removal, no redundant header Close control, a neutral reason field with one inline error and a divider above Cancel/Delete. Solid danger buttons now use the sampled red with white text. Validation preserves the action verb; Retry is reserved for an actual operation failure. Generic modals retain an optional icon-only Close control through `showClose`, independent of Escape/backdrop cancellation.

No feature pages, shell, idle engine or saving/progress implementation changed. The existing font family and main palette remain; new semantic feedback tokens are scoped and documented. Dark mappings are provisional because the supplied artwork is light-theme only.

Executed after correction: typecheck and production build passed (existing ExcelJS CommonJS warning); 126 unit/component tests passed; 18 feedback/reference/visual/accessibility browser tests passed against reviewed snapshots; 3 existing page visual regression cases passed without updating their baselines. `git diff --check` passed. Keyboard dismissal, reason association, desktop/phone, dark/light, reduced-motion and long-dialog scrolling are covered. This is scoped verification, not a claim that the entire repository e2e suite was run.

## Part 2 — progress, HTTP and background tasks

Part 2 extends shared components/services. It does not add dirty-form tracking, redesign idle dialogs, introduce a new app footer or add the Part 6 demo page. The root app mounts one blocking dialog and one authenticated task panel; the existing administration shell mounts the read/navigation bar and offline banner once, directly beneath its header.

### Shared progress

`SmartProgressBar` remains the single bar renderer for foreground calls, inline uploads, legacy operations, grid export jobs and background tasks. It accepts the existing `label`, `percentage`, `text`, `status`, `cancellable` and `cancelled` API. New options are `completed`, `total`, `unit`, `etaSeconds`, `showDetails` and `size: 'normal' | 'thin'`. Canonical states are `running`, `completed`, `failed`, `cancelled`; `success` and `error` remain aliases. A normal track is 8px; the read/navigation indicator uses the same component at 3px. Counts and optional ETA appear below the track.

Unknown duration omits numeric ARIA attributes and percentage text. Elapsed time never creates progress. Determinate values come from explicit completed counts, confirmed stages or browser transfer events. Reduced motion leaves a stationary indeterminate fill. `SmartProgressStatus` supplies the matching textual state pill so color is not the only status cue.

### Foreground blocking

```ts
const result = await blockUi.run('Saving your changes', async handle => {
  await validateOnServer();
  handle.update({ completedSteps: 1 });
  const result = await saveOnServer();
  handle.update({ completedSteps: 2 });
  return result;
}, { message: 'Sending your changes to the server.', steps: ['Check the workflow', 'Save the changes'] });
```

`BlockUiService.begin(options)` returns an idempotent `update`/`end` handle for streams; `run` preserves the work's return/rejection semantics and finalizes its handle. Several callers, including manual wrappers around HTTP, share one dialog. Display starts after 300ms, remains at least 400ms once shown, and ends after the final operation. A new request during minimum visibility prevents premature closing. The first active operation supplies the displayed title/stages; update the manual wrapper's handle when it owns stage reporting.

The dialog reuses SmartModal and SmartProgressBar: spinner/title, optional message, real percentage or confirmed steps or unknown duration, an 8s slow message and the exact keep-open note. There is no close action; Escape/backdrop cannot dismiss it. Foreground progress preempts a normal shared modal and resumes it afterward. Original focus is retained even if the saved form closes during the operation. Identity changes reset old presentation/handles.

Visible foreground work counts as client activity through the existing SessionService and its non-sensitive cross-tab channel. Server expiry remains authoritative; neither progress nor background polling renews the server session or overrides its security deadline. Idle-dialog presentation itself remains for Part 5.

### HTTP options

```ts
http.patch(url, changes, {
  context: requestFeedback({ title: 'Saving your changes', message: 'Sending your changes to the server.' }),
});
http.get(url, { context: requestFeedback({ blockUi: true, title: 'Opening record' }) });
http.post(searchUrl, query, { context: requestFeedback({ mode: 'read' }) });
http.get(statusUrl, { context: requestFeedback({ mode: 'background', errorToast: false }) });
```

`REQUEST_FEEDBACK` is an HttpContextToken; `requestFeedback(options)` creates a context. Options include `blockUi`, `title`, `message`, `steps`, `mode` and `errorToast`. Application API writes block by default; reads use the thin bar. `blockUi: false` opts out; a read can opt in. `mode: 'read'` classifies POST searches correctly. `mode: 'background'` excludes polling and housekeeping from blocking, the read bar and foreground activity. Existing server-grid search uses the read classification. Session lookup/renewal are background; sign-in, sign-out and profile writes retain foreground semantics with existing inline auth error presentation.

The interceptor is scoped to the configured same-origin API path, retains credentials/XSRF/auth handling and uses the existing 10s HTTP timeout/retry policy. Request cancellation and every terminal path release their own handles. Confirmed upload/download events provide percentages only with valid totals; uploads use the existing XHR transport's progress support. Errors use safe ApiError presentation, never raw server exception bodies. Timeout copy is the requested “The server didn't respond. Your changes weren't saved.” Error object deduplication prevents the progress interceptor, opt-in error interceptor and manual wrapper from emitting duplicate toasts.

Memory-only development adapters do not pass through HttpClient, so an interceptor cannot observe their operations. Use the shared manual API where a mock/provider needs blocking; Part 2 does not insert page-level wiring into existing mock screens.

### Connection banner

`ConnectionService` handles browser offline/online events and API network failures. The banner preserves content and displays the specified message, retry countdown and Retry now. Retries probe the existing configured session **GET** endpoint only; failed writes are never replayed. Any HTTP response proves connectivity, while normal authorization/session handling remains independent. Recovery hides the banner and emits `reconnected` for providers that choose to refresh data. Failed probes back off from 5s to at most 30s; concurrent probes are coalesced. The safe probe suppresses duplicate error toasts and auth side effects.

### Background tasks

```ts
const task = tasks.start({
  id: confirmedServerJob.id,
  title: 'Importing members.csv', unit: 'rows', total: confirmedServerJob.total,
  monitoring: true,
  run: () => jobProvider.watch(confirmedServerJob.id),
  cancel: () => jobProvider.cancel(confirmedServerJob.id),
  download: () => jobProvider.download(confirmedServerJob.id),
  retry: () => jobProvider.retry(confirmedServerJob.id),
});
```

`run` can return an Observable of TaskSnapshot, a Promise or void. Promise/void callbacks must call `complete` or `fail` when the server acknowledges the final outcome; resolving a start-request promise alone does not prove that a long server job completed. For a polling/push adapter that reports through callbacks, its handle exposes `progress(done, total?, etaSeconds?)`, `update`, `complete({message?, download?})`, `fail(message)` and confirmed `cancel()`. Provide cancellation/download/retry callbacks only when the backend supports them. `handle.signal` detaches client monitoring on identity change/destruction; do not map that signal to server-job cancellation. Retry uses an explicit callback; a failed monitor checks the same job rather than submitting another job. Late attempts and old identities cannot overwrite current state.

Root-owned state/monitor subscriptions survive navigation. The panel supports minimize, acknowledged status/counts/ETA, confirmed Cancel with Keep running/Cancel task, completed Download, failed Retry and clearing finished rows only when none run. Focus returns to a declined action or the finished row. Completion/failure emits a toast. The panel is above content, below native dialogs, and reserves the future footer's 32px anchor; no footer was introduced in this part.

Existing export providers are adapted into TaskService; their component no longer owns a parallel polling/download/cancel lifecycle. A pending initial start is still cancelled on component destruction, while an acknowledged server job continues in the root monitor. Client logout stops monitoring and clears private rows, never sends cancellation to the server. Blob URLs are revoked and download metadata is checked for expiry, safe filenames and same-origin configured API paths.

For refresh restoration, configure `TASK_API_CONFIG` and the supplied `ApiTaskProvider` (registered at app composition) or supply `BACKGROUND_TASK_PROVIDER`. **The default endpoint is null:** this frontend repository has no deployed task-list/retry backend, so it does not invent a production URL or claim refresh persistence before that contract is supplied. Existing export start/status/cancel/download calls work through their existing adapter; a unified task list must be implemented server-side for recovery after reload. See [the backend task contract](BACKGROUND_TASK_CONTRACT.md).

### File upload

`SmartFileUpload` retains its selection CVA and inputs; it never makes HTTP calls. `uploads: readonly FileUploadState[]` binds each selected File to `uploading`, `checking`, `ready`, `failed` or `cancelled`, with `loaded`, `total`, `message` and `canCancel`. Its `cancelled` output emits the File so the provider can abort the actual transfer. Selection/clearing is locked while an upload/check is active. Limits are always visible and rejection messages explain how to correct the file.

Use `observe: 'events'`, `reportProgress: true` and `requestFeedback({blockUi:false, errorToast:false})` in the transport provider for non-blocking inline uploads, then bind actual transfer bytes to the control. Checking remains indeterminate. Show Ready/result summary only when the server acknowledges completed checks; reaching 100% transferred alone is not readiness. Backend content validation, size enforcement and malware checking remain server responsibilities. No upload endpoint or production progress simulation was added.

### Visual references and validation

Saving/stepped, upload and unknown-length dialogs follow `ref-3`, `ref-7`, `ref-8`; task panels follow `ref-5`/`ref-6`. Existing fonts, corrected feedback surfaces/radius/shadow and semantic colors are reused; brand purple remains the actual application token. A small documented token mix makes failed-pill/offline copy AA-readable on pale red. Unknown-duration bars honor reduced motion, and dialog focus is announced without an outer focus ring around a non-interactive card. Keyboard focus indicators on controls remain.

Screenshots live in `e2e/ui-components-part2.spec.ts-snapshots/`. Existing grid snapshots were reviewed and caught up to the already implemented Part 1 Clear all filters icon; no grid layout redesign was made. Two desktop dialog snapshots changed only at rounded corners where the underlying showcase's newly colored progress bars are visible. Part 1 dialog contents and toast designs remain unchanged.

Part 2 verification completed on 2026-11-15:

- Application/spec typecheck and production build passed; the existing ExcelJS CommonJS optimization warning remains.
- All 164 unit/component/service tests passed, including HTTP timing/timeout/cancellation, modal preemption and original-trigger restoration, terminal monitor cleanup, old-attempt fencing, owner-scoped restoration, upload states and foreground/idle interaction.
- The combined authentication/feedback/grid/Part 1/Part 2 browser run passed all 54 cases without snapshot updates. Three additional existing shell/mobile/dashboard/create-form visual cases passed without baseline changes, for 57 distinct browser cases checked. The existing component catalog also passed all nine cases, bringing the total to 66 distinct browser cases. Its upload assertions and phone/desktop snapshots were updated for visible size/type limits; its action snapshot was reviewed against the existing Part 1 buttons. A final 16-case subset rechecked Part 2, export lifecycle and those page visuals after terminal-monitor cleanup.
- Automated axe, keyboard, light/dark, phone/desktop, reduced-motion, real HTTP interception via request fixtures, safe offline recovery and actual downloads were exercised. Twenty Part 2 reference snapshots were reviewed; their injected values are test fixtures, never production progress simulation. Counts determine their true rounded percentage (for example 7/12 is 58%, rather than the artwork's illustrative 57%).
- Production-auth isolation verification passed for all 37 emitted JavaScript assets. `git diff --check` passed. No new dependencies, feature-page edits, commit, push or merge were made.

Backend task-list/retry/refresh recovery and real file transfer/content checks remain server integration contracts, as registered in `KNOWN_LIMITATIONS.md`. No production API deployment, load profile, manual screen-reader certification or unrun repository checks are claimed. Part 2 stops here; Part 3 has not started.


## Part 3: form controls and unsaved changes

All controls now compose `SmartFormField`, including radio groups. Common inputs add `disabledReason` (visible, associated help) and `validationMode: 'auto' | 'submit' | 'touched'`. Required labels, help and actionable client/server errors use the same wrapper. Existing fonts, semantic colors and control geometry remain authoritative.

### Registered form lifecycle

```html
<form [formGroup]="form" smartForm #state="smartForm" (ngSubmit)="save(state)">
  <smart-textbox formControlName="name" label="Name" [required]="true" />
  <smart-action-toolbar placement="form" [form]="state" (closed)="close()">
    <smart-button primaryAction type="submit" label="Save changes" variant="primary" />
  </smart-action-toolbar>
</form>
```

```ts
async save(state: SmartForm): Promise<void> {
  if (!state.validate()) return;
  await state.save(() => this.provider.save(this.form.getRawValue()));
}
```

Import `SmartForm` on new reactive forms. Its auto policy validates on submit, then on change. `validate()` also supports Save/Next buttons outside the native form. Reset starts a fresh validation cycle. Explicit `errors` remain visible without waiting for submit. For compatibility, existing forms without `smartForm` and standalone controls retain touch feedback, including callbacks using `markAllAsTouched`. `validationMode="submit"` explicitly selects native-submit validation, and `validationMode="touched"` explicitly selects touch validation. This preserves existing page behavior until Part 6 migration.

`DirtyFormsService.track(control, destroyRef?)` returns a `DirtyFormTracker`: `isDirty()`, `closeLabel()`, `save(work)`, `markSaved()`, `requestLeave()` and `destroy()`. `SmartForm` registers/disposes it automatically and exposes the same lifecycle methods plus `validate()`. Manual consumers must pass DestroyRef or destroy their tracker. No form values are serialized or stored in browser storage.

`save(work)` returns the provider result. Failed saves stay dirty; edits made during a pending save also stay dirty. `markSaved()` is for an externally coordinated successful save, never a failed request. Reset clears dirty state. Passing a tracker or SmartForm through `[form]` to `SmartActionToolbar` shows the amber Unsaved changes pill with an edit icon and provides a Close/Cancel action beside the primary button. It emits `closed` only when leaving is allowed. Do not also project a cancel button in this mode. Existing `[dirty]`, `[cancelAction]` and `closeLabel()` APIs remain supported.

### Router and browser protection

Add `canDeactivate: [DirtyFormGuard]` to a form route. Existing `UnsavedChangesGuard` imports point to that implementation, preserving the legacy `requestLeave()` fallback when no registered form is dirty. Registered dirty forms use DialogService: **Discard your changes?**, **Keep editing**, **Discard** (danger). Escape/backdrop keep editing. Discard permits navigation; it does not mark data saved. Repeated leave requests share one prompt.

The registry installs one `beforeunload` listener only while a registered form is dirty. Saving, resetting, disposal or security invalidation removes it when no other dirty form remains. Browsers choose the warning text and require prior user interaction. Voluntary logout asks first. Expiry/invalidation clears the registry, cancels a pending discard prompt, and cannot wait behind voluntary logout. The server session remains the security boundary.

### Selection and control specifics

`SmartAutocomplete` and `SmartMultiSelect` share one searchable/paged implementation. `*` bypasses minimum query length and browses all (remote providers receive an empty query); typing a new query filters results. Local/remote pages default to 25, with Load more and at most 100 rendered options before refinement. Multiple selections have removable chips. Disabled options, stale-request cancellation, arrow/Home/End/Enter/Escape keys and `aria-activedescendant` are supported. Supply `selectedLabels` when remote selections precede their page. A single autocomplete displays its selected label in the input with Clear.

Multi-select keeps its options/size/common inputs and readonly string-array CVA, adding `provider`, `pageSize`, `minLength` and `selectedLabels`. Its native multiple-select DOM is replaced by the required combobox/listbox; `size` remains accepted for source compatibility. Tests using native selectOption must use the combobox instead.

Password inputs never echo non-empty programmatic model writes, including restored server values. Initialize credential controls empty and use a separate configured indicator; model values are not replaced with masked placeholders. User edits still emit normally. There is no copy action, persistence or logging; autocomplete remains new-password. Use toggles for immediately applied settings and checkboxes for values submitted with Save. The generic controls never call HTTP themselves.

Both date controls validate model values against min/max, not only native picker affordances. Ranges validate both endpoints and order, and the end minimum respects both global minimum and start. `[accessDate]="true"` defaults an empty enabled editable start to the local calendar date without making the form dirty or overwriting an existing date. Generic date controls retain empty defaults.

### Scope and visual review

Desktop/phone snapshots were reviewed against UI-037 and existing catalog baselines. The intentional geometry change is searchable multi-select replacing the taller native select, plus the shared radio label. Popovers/chips reuse existing autocomplete styles; no new exact screenshot match is claimed for those controls. The dirty pill uses the requested edit icon. No feature page, idle dialog or layout redesign was made. Existing page dirty callbacks/copy and the catalog's legacy native-multi-select help text remain for Part 6. New routes adopt smartForm and DirtyFormGuard for the new lifecycle. Part 4 has not started.


Part 3 verification on 2026-11-15:

- Typecheck and production build passed. Production auth isolation verified all 36 emitted JavaScript assets. Existing ExcelJS CommonJS and optional-chain compiler warnings remain.
- All 178 unit/component/service tests passed, including the shared field states, submit/change/reset cycle, local/remote wildcard paging, readonly/disabled selection, keyboard focus, date constraints, password model-write suppression, router cancellation/discard, conditional beforeunload cleanup, concurrent save edits and the logout/expiry race.
- 53 distinct browser cases passed across administration, authentication, form controls, feedback/wizards and Part 3. The broad run passed 51/53; the two failures involved sign-in readiness and post-discard lazy navigation under concurrent build/test load. A four-case serial rerun passed both plus the remaining Part 3 cases without source changes. No claim is made that the broad run passed on its first attempt.
- Axe, keyboard focus, browser refresh dismissal, phone/desktop reflow, light/dark rendering and existing page/form/dialog visual regressions were exercised. Component form/action snapshots were reviewed and updated for the required shared-control changes. The approval browser assertion was aligned with the already approved Part 1 reason copy/action; no approval page source changed.
- Generated reference-comparison captures from the existing broad test were restored; intentional component regression baselines remain. No dependencies or feature-page source changed. git diff --check passed. No commit, push or merge was made.

Part 3 stops here. Adopting the new lifecycle in existing pages and replacing their legacy copy/callbacks remains Part 6; no Part 4 work was started.


## Part 4: layout, navigation and containers

### Shell and footer

At every viewport width, AdminShell owns a 100dvh column: header, loading/offline feedback, a single scrolling main area, and the footer. Sidebar navigation scrolls independently. The footer occupies only the content column and follows collapsed navigation width. On phones the footer wraps inside the same fixed-height column and stays visible; the document does not scroll. Main establishes the containing block for absolute accessibility labels, so long forms cannot create a second body scrollbar. Successful route navigation resets the content scroller; declined navigation retains its position. The existing root application outlets remain singletons across sign-in and authenticated routes: AuthDialogs, DialogHost, ToastContainer, BlockUi and authenticated BackgroundTasks. Loading and offline outlets remain mounted once in AdminShell. The idle design is unchanged pending Part 5.

`SmartAppFooter` renders the current year and `APP_METADATA` configuration. Override the token at deployment:

```ts
{ provide: APP_METADATA, useValue: {
  product: 'SmartIAM', version: '1.4.2', environment: 'Production',
  links: [
    { label: 'Privacy', href: 'https://your-approved-host.example/privacy' },
    { label: 'Terms', href: 'https://your-approved-host.example/terms' },
    { label: 'Help', href: '/help' },
  ],
} satisfies AppMetadata }
```

The example URLs are placeholders, not deployed policies. Default configuration uses the current package version (0.0.0), the selected production/development environment, and null legal/support destinations. Null/unsafe destinations render unavailable text with an explanation; no fake legal pages or dead routes were invented. Root-relative configured links use the Angular router so dirty route guards run; HTTPS links use normal navigation/browser unload protection. Supply real approved destinations before release.

The desktop minimum footer height is 32px. Resize/intersection observation updates the semantic `--iam-app-footer-offset`, so floating tasks stay above a wrapped/visible footer and do not reserve an invisible mobile footer's height. Cleanup restores the previous offset. Palette/fonts reuse existing tokens; footer geometry is specified by the prompt rather than claimed as a sampled footer reference.

Stack tokens cover content, sticky regions, navigation/backdrop, header/footer, popovers, tasks, dialog, block, idle and toast. Native dialogs/popovers additionally use the browser top layer. The toast outlet is one manual popover, re-raised after newly opened overlays without taking keyboard focus; CSS z-index alone cannot overtake native modal dialogs. ModalScrollLock now locks both body and the desktop main scroller with reference counting, and modal bodies contain overscroll.

### Table, grid and pager

AG Grid remains the only data-grid implementation and retains its own row virtualization, sticky column header and horizontal viewport. The shared grid card bounds its scrollable content on desktop, leaving its existing pager outside that scroller. Narrow/zoomed layouts wrap controls rather than pushing the document sideways. Pager navigation labels include the grid title; numbering, selection, export and server paging APIs remain unchanged.

`SmartTable` provides the same ownership for native tables:

```html
<smart-table label="Employees">
  <table>
    <caption class="sr-only">Employees</caption>
    <thead><tr><th scope="col">Name</th></tr></thead>
    <tbody><!-- typed rows --></tbody>
  </table>
  <div tablePager><!-- existing pager --></div>
</smart-table>
```

Its focusable region owns x/y scrolling, native column headings are sticky, and `[tablePager]` stays outside the overflow region. `--smart-table-max-height` (default 65dvh) and `--smart-table-border` allow composition within an existing card. Shared dashboard chart tables reuse it without an extra frame. No feature-specific tables/pages were rewritten.

### Drawer

`SmartDrawer` composes SmartModal with a side presentation; it does not maintain a second focus trap or scroll lock. Header icon/title/close and a projected footer remain fixed while only the body scrolls. It is 480px wide on desktop and full viewport width on phones. Escape, close and backdrop use the same guarded close path. Existing title/open/closed inputs/outputs remain.

```html
<smart-drawer title="Edit details" icon="UserRound" [open]="open()" (closed)="closeAndReset()">
  <form [formGroup]="form" smartForm #state="smartForm"><!-- shared fields --></form>
  <smart-action-toolbar drawerFooter [form]="state" (closed)="closeAndReset()"><!-- save action --></smart-action-toolbar>
</smart-drawer>
```

Use `#state="smartForm"` on the form if referring to it in the same template scope, or pass the owned tracker explicitly through `[form]`. The drawer discovers projected SmartForm directives and can also receive `[form]="tracker"` for forms owned inside child components. Dirty close asks through the existing shared DialogService. Repeated close requests coalesce; cancelled close keeps the form. The consuming controlled open/closed handler owns loading/resetting its domain model, and should reset or destroy that form after an accepted discard. Hiding an open input alone does not claim data was saved or reset. Existing SmartActionToolbar nodes with static placement="form" are also projected into the drawer footer automatically; arbitrary page body actions remain for Part 6 migration.

SmartActionToolbar placement="form" stays pinned within its owning form, with its buttons above any active floating task panel. The panel publishes measured --iam-tasks-clearance; the main/document scroll owners reserve matching end space and scroll padding so the final controls stay reachable. Field scroll margins account for the form footer. Minimize remains available when people want more of the page visible.

The drawer uses lower ModalQueue priority than confirmations, so its discard dialog can take ownership and then restore focus to the drawer. Closing restores the original trigger. These are the same modal behaviors used by ordinary dialogs.

### Tabs, accordion, breadcrumb and display

```html
<form [formGroup]="form" smartForm>
  <smart-tabs label="Employee sections" [tabs]="tabs" [active]="active()" (changed)="select($event)">
    <!-- active section -->
  </smart-tabs>
</form>
```

Tabs keep their existing approved appearance and horizontal overflow. Arrow/Home/End navigation skips disabled tabs and uses one tab stop plus tablist/tab/tabpanel relationships. User changes use the nearest/projected SmartForm or an explicit `[form]` tracker; unrelated forms do not block them. Keep editing leaves selection/output unchanged and returns focus to the selected tab. Discard permits one change. Parent-driven `active` updates remain the existing controlled reset/permission API; the caller owns the displayed model and any accepted discard/reset.

```html
<smart-accordion-group [single]="true" label="Request sections">
  <smart-accordion title="Request details" status="complete">...</smart-accordion>
  <smart-accordion title="Evidence" status="needs-input">...</smart-accordion>
</smart-accordion-group>
```

The optional group supports one open section; default single=false preserves multiple independent sections. Native details/summary keeps Enter/Space access. Status is optional and shows Complete or Needs your input with the shared badge, never color alone. expanded/expandedChanged preserve controlled initialization and change notification.

`SmartBreadcrumb` accepts items/label and always renders the last item as current text, even if it has a path. Parent links use their actual configured routes. `appearance="header"` supplies the existing shell typography/truncation/mobile behavior; AdminShell now reuses it rather than duplicating breadcrumb markup.

```html
<smart-status-badge tone="ok" label="Active" />
<smart-status-badge risk="high" label="High risk" />
```

`SmartStatusBadge` (also exported as StatusBadge) is the single badge implementation: ok/warn/bad/info/mute. Risk none/low/medium/high/critical maps to mute/ok/warn/bad/bad through statusToneForRisk. SmartBadge's neutral/success/danger/warning/info API and SmartStatusIndicator remain compatibility adapters over it. Provide meaningful label/content; risk/status is not communicated through color alone.

Part 4 stops before idle timeout redesign (Part 5), page migration and the demo route (Part 6). No feature-page source or dependencies changed. Reference review used UI-246, UI-181 and UI-037; existing fonts, colors and control styling remain authoritative. New footer/drawer/container behavior uses the prompt's geometry with existing semantic tokens, not an invented pixel-equivalence claim.


Part 4 verification completed on 2026-11-16:

- Typecheck and production build passed. The production-auth isolation check verified all 36 emitted JavaScript assets. Existing ExcelJS CommonJS and optional-chain compiler warnings remain.
- All 188 unit/component/service tests passed, including scoped drawer/tab dirty confirmation, modal content-scroll locking, drawer footer projection, accordion exclusivity/status text, semantic risk mapping, footer configuration/URL safety, table containment, toast top-layer participation and task-panel clearance cleanup.
- 74 distinct browser cases passed: 39 controls/grid/feedback/Part 1/Part 2 cases, 34 shell/Part 3/Part 4 cases and one existing dashboard/create-form visual case. The two shorter regression groups exited cleanly; a prior combined run reported all 73 cases passed but its shell ended uncleanly after reporting results, so it was rechecked in those groups. No snapshot updates were used in the verified groups. The isolated control visual case was also rechecked after its final baseline update.
- Automated axe checks, keyboard focus, dirty-dialog cancellation/discard, responsive reflow down to 320px, phone/desktop light/dark, independent main/sidebar scroll, fixed desktop header/footer, mobile document footer, drawer body scrolling, pager/x-scroll containment, exports/downloads and foreground/background feedback were exercised.
- Nine new Part 4 snapshots were reviewed (four footer, four drawer, one toast-over-drawer). Existing shell/grid/form/action/dashboard/create-form snapshots were reviewed and updated for the new scroll ownership, footer, shared status rendering and drawer composition. Tall isolated form controls are captured in a larger test viewport with sticky toolbar positioning neutralized for that capture, so help text is not obscured; real pinned-footer behavior is covered separately at normal viewport size. The export test uses the canonical task Cancel and Minimize controls before continuing with page fixtures.
- git diff --check passed. No dependency or feature-page source changes, commit, push or merge were made. Existing user changes from earlier parts remain intact.

Deployment still needs approved Privacy/Terms/Help destinations in APP_METADATA. Feature-page migrations/demo remain Part 6. Part 4 stops here; Part 5 idle timeout work has not started.

## UI Patterns showcase (revised Part 6 scope)

Open **Component Library → Open UI Patterns**, or `/ui-patterns`, in a development build with `showcase.view`. The route is lazy loaded and permission guarded; production has no showcase route, fixture provider or interceptor. The user explicitly cancelled business-page migrations. Existing profile, workflow and record pages remain unchanged.

The development sidebar also exposes **Administration → UI Patterns**. It uses the existing permission filter and active-route styling; users without `showcase.view` do not see the link. Production navigation omits it.

The Forms section starts with **Searchable autocomplete**: single and multiple selection, a search icon, labelled Clear, two-character search, `*` browsing, five-result pages, keyboard selection and removable chips. The twelve names are synthetic local demo data. The same `SmartAutocomplete` supports remote providers; the showcase does not add another search implementation.

The sample request groups fields into Request details, Access period, and Owners and confirmation. Descriptions explain each group, long text spans the grid, and the existing form footer keeps Save/Cancel and dirty feedback together. Shared field errors use a decorative alert icon with readable text below the field, existing semantic error tokens, and the existing aria-describedby/aria-invalid connections. Errors still appear on submission and update on correction; the required-reason dialog retains its reference text-only presentation.

The five sections compose the existing components rather than implementing new feedback or form behavior:

| Section | Examples and shared APIs |
|---|---|
| Actions and feedback | `SmartButton` variants/action confirmations, disabledReason/loading, `SmartButtonGroup`, ToastService four tones, DialogService.confirm/confirmWithReason/info, SmartModal |
| Progress and tasks | Automatic write interception through requestFeedback, quick/unknown/slow/failure/read responses, BlockUiService.run with confirmed steps, TaskService cancellation/retry/download, SmartFileUpload byte counts/checking/errors, ConnectionService banner, local overlay/skeleton/spinner/progress |
| Forms and unsaved changes | Typed Reactive Forms, all shared field types, submit validation, SmartForm, SmartActionToolbar, guarded tabs/routes, immediate confirmed toggle |
| Tables and selection | SmartTable with sticky header and contained scrolling, existing GridPaginationComponent in tablePager projection |
| Containers and status | SmartDrawer with guarded SmartForm, SmartAccordionGroup single mode, SmartBreadcrumb current item, SmartStatusBadge five tones and risk |

Usage examples for the individual inputs remain in the sections above. The runnable composition is `src/app/features/dev/ui-patterns.html`; its TypeScript owns only demo values, work callbacks and outcomes. Global feedback/session/task outlets remain mounted once in the shell. No new public component API, library or parallel pattern implementation was added.

Demo work is isolated in UiPatternsDemoProvider and UiPatternsDemoInterceptor. A save validates and stores a local revision before confirming stages. Background jobs create 500 synthetic rows in confirmed batches; export downloads those rows, retry reruns a failed attempt, and cancellation waits for acknowledgement. Local CSV checks count actual bytes read, then check basic structure without a checking percentage. Nothing is uploaded; CSV parsing, authorization and durable jobs require backend adapters. Jobs survive Angular route changes through the existing root service, but local fixtures cannot survive a hard refresh.

```ts
const context = requestFeedback({ title: 'Saving your changes' });
// The showcase uses only /api/ui-patterns-demo/* fixture endpoints.
await firstValueFrom(http.post('/api/ui-patterns-demo/unknown', {}, { context }));
```

```html
<form smartForm #state="smartForm" [formGroup]="draft">
  <smart-textbox label="Request name" formControlName="name" [required]="true" />
  <smart-action-toolbar placement="form" [form]="state" (closed)="resetDraft()">
    <smart-button primaryAction type="submit" label="Save" icon="Check" variant="primary" />
  </smart-action-toolbar>
</form>
```

The showcase freezes native fields with a disabled fieldset during saving; state.save owns dirty clearing and protects edits made during an asynchronous save. The immediate toggle uses confirmChange and commits only after its callback succeeds. Do not put credentials into the password example.

The idle card reuses AuthDialogPreview and the existing session engine. The opt-in `/ui-patterns?idleDemo=1` reloads development configuration with a 30-second idle limit and 15-second warning. Restore normal timing reloads without the flag. This demonstrates current behavior; it does not claim the unimplemented Part 5 shared-modal/progress design is complete.

An accessibility fix discovered by the showcase maps the outlined success button to the existing theme-aware completed-text token. Light styling and the solid success fill remain as before; dark outlined success text is now readable.

See [Part 6 acceptance review](ui-components-part6-acceptance.md) for scope, verification and prerequisite gaps.


### Fixed footer and advanced grid follow-up

The footer remains outside the main content scroller at phone, tablet and desktop widths. Its space is reserved by flex layout rather than overlaying the last controls. The sidebar may scroll independently, and grids keep their own row/horizontal scrolling; there is only one page-content scroller and no document scrollbar. Modal/drawer body scrolling remains scoped to those components.

UI Patterns now includes **Advanced data grid**, composing SmartDataGridComponent with 1,000 deterministic synthetic employees. It reuses shared search, column filters, sort, selection, column preferences, pager, CSV/XLSX exports and a shared read-only details drawer. Its fixture is bounded and development-only, and preferences use the current user's scope. No new grid implementation or business-page code was added.
