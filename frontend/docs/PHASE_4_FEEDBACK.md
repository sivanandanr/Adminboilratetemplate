# Phase 4 — Feedback, dialogs, notifications and wizards

## Run the demonstrations

Run `npm.cmd start` from `frontend`, sign in with the documented Phase 2 administrator, and open `/dev/feedback`, `/dev/wizard` or `/dev/notifications`. These lazy routes require `showcase.view` and are absent from production. `/notifications` is the normal authenticated notification center and requires `profile.view`. The header bell is now functional. No Phase 5 grids/exports were started.

No full UI framework or new dependencies were introduced. Angular standalone components use OnPush, Signals, typed forms and the existing Tailwind v4/token infrastructure. Native dialog top-layer behavior supplies background inertness; explicit Tab wrapping, initial focus, focus restoration and reference-counted body locking supplement it. CDK was not necessary for this bounded implementation. The existing drawer, loading overlay, buttons, fields, header and icons remain the authoritative components.

## Visual evidence and limits

The root/frontend AGENTS, design analysis, 253-image manifest, token register and Phase 1–3 code were reviewed. UI-246 remains the shell/action anchor; UI-037 supplies form/confirmation action hierarchy; UI-244 was inspected at full resolution for the step/status/progress and Save Draft/Next composition. UI-244 uses blue primaries and a different sidebar width: its palette is deliberately not mixed into the purple administration baseline. The application-registration demonstration is a generic five-step form rather than a reconstruction of Access Review Designer.

All surfaces, borders, text, semantic tints, primary actions, radius, spacing, focus and shadows use existing CSS variables. Toasts use the sampled success/info/warning/danger fills with navy copy in both themes; modal/dialog surfaces use near-white/dark surfaces, purple confirmations and the existing danger variant. Cancel precedes confirmation on the right. Wizard Previous sits left; Save Draft/Next/Finish sit right. The stepper is horizontal on desktop, stacks on mobile and supports an explicit vertical mode.

Toast position/motion, 560px modal width, overlay behavior, focus rules, notification dropdown dimensions and responsive wizard behavior are provisional interaction decisions. Dedicated readable modal/toast/mobile references, authoritative fonts and brand assets remain unavailable. No pixel-perfect fidelity is claimed. Implementation snapshots are regression baselines, not proof of exact source-image equivalence.

## Toast APIs

`ToastService.show(ToastOptions): number` accepts display-safe `title`, optional `message`, `tone: success|info|warning|error`, `durationMs`, and an optional `{label, run}` action. `dismiss(id)`, `dismissAll()`, `pause(id)` and `action(id)` manage lifecycle. Auto-dismiss defaults to six seconds; error/action toasts default to persistent. Zero duration means persistent. Positive durations are at least one second. Hover/focus makes a toast persistent until explicitly dismissed, protecting users from losing an action while reading it. At most eight are displayed; old toasts are evicted, so this is not an audit log.

`SmartToast` has `item` input and `dismissed`, `paused`, `action` outputs. `SmartToastContainer` consumes the central service and is mounted once at the app root. Error messages use `role=alert`; other variants use `role=status`. The top-right stack wraps at mobile widths, supports native keyboard action/dismiss buttons, and respects the existing reduced-motion policy. Text is interpolated; no arbitrary HTML is rendered. Timers are cleared on dismissal and destruction.

```ts
const id = toastService.show({ tone: 'success', title: 'Changes saved', message: 'The service confirmed the update.' });
toastService.show({ title: 'Review available', action: { label: 'Open', run: () => openReview() } });
```

Callers must supply approved user-facing text, never credentials, tokens, raw HTTP payloads or exception stacks. Generic errors should go through ErrorPresenter.

## Modal, message and confirmation APIs

`SmartModal`: required `title`, `description`, `open`, `closable`; projected body/actions; `closed` emits a request and the consumer must set `open=false`. It labels/describes the native dialog, wraps Tab/Shift+Tab, restores the prior connected focus target, and blocks Escape/backdrop/Close when `closable=false`. A projected element with `data-initial-focus` receives initial focus. `ModalScrollLock` reference-counts nested modal/drawer locks. `SmartDrawer` is the existing Phase 3 side panel, now sharing this lock.

`DialogService.message(options)` queues a text-only `SmartMessageBox`. Options: `title`, `message`, `tone`, `primaryLabel`, `secondaryLabel`. It resolves `Promise<ConfirmResult>`. The box has a tone/icon, primary action, optional secondary action and Close/Escape behavior. Direct component consumers use `options` and `completed`.

`ConfirmationService.confirm(ConfirmOptions)` uses the same queue and `SmartConfirmDialog`. Options extend the message contract with `kind: confirm|delete|unsaved|logout|privileged`, `reason: optional|required`, `typedText`, `execute({reason, signal}): Promise<void>` and `cancellationSafe=false`. Result is `{confirmed:boolean, reason?:string}`. Only one queued request is displayed at a time by the root `SmartDialogHost`.

Required reason and exact typed confirmation are checked before execution. The default initial focus is Cancel. A busy operation blocks duplicate submissions and all accidental dismissal. Set `cancellationSafe=true` only when the operation really honors AbortSignal safely; cancellation aborts and late completion cannot report success. Failures stay in the dialog with generic feedback and an explicit Retry. Retrying a side effect requires an idempotency key or checking the backend outcome; the UI cannot infer whether an interrupted request committed. Session/user changes settle queued dialogs as cancelled; component destruction aborts pending work. Aborting a request is not evidence that a server action was rolled back.

```ts
const result = await confirmationService.confirm({
  kind: 'delete', title: 'Delete configuration?', message: 'This removes the selected configuration.',
  primaryLabel: 'Delete', reason: 'required', typedText: 'DELETE',
  execute: ({ reason, signal }) => repository.remove(id, reason, signal),
});
```

Existing Phase 2 authentication dialogs retain their tested lifecycle. The general service supports logout/unsaved presets without replacing authentication/session business logic.

## Progress APIs

`SmartProgressBar`: required `label`; `percentage: number|null`, `text`, `status: running|success|error|cancelled`, `cancellable`; `cancelled` output. Null/invalid/out-of-range values are indeterminate and omit `aria-valuenow`. Valid values are rounded for display. `SmartSpinner` exposes a loading label. `SmartLoadingOverlay` remains the Phase 3 inert-content wrapper. `SmartRouteProgress` tracks Angular navigation start/end/cancel/error at the root without fabricated percentages.

`ProgressService.begin(label, cancel?)` returns an ID. `update(id, {completed,total,text})` derives progress only from valid confirmed counts; alternatively supply an explicit known percentage. `finish(id,status)` marks a terminal result (success is 100%). `cancel(id)` invokes an explicitly supplied safe cancellation callback at most once. `dismiss(id)` removes terminal records; `clear()` clears operations during user/session changes. Mount `SmartOperationProgress` wherever the consuming feature presents these operations. Terminal records remain until dismissed; consumers should manage lifecycle.

```ts
const operation = progress.begin('Provision accounts', () => controller.abort());
progress.update(operation, { completed: confirmedCount, total: requestedCount, text: 'Accounts confirmed by service' });
// Only after successful service completion:
progress.finish(operation, 'success');
```

The demonstration's three work items advance only after their mock promises resolve. Unknown-duration examples never show an invented estimate. Real operation progress/cancellation needs a backend contract; no polling/realtime infrastructure was invented.

## Notifications

Typed contracts live in `core/notifications/notification.models.ts`. Categories: approval tasks, access requests, provisioning, access reviews, workflow escalations and system announcements. `NotificationProvider` exposes `list(query)`, `markRead(ids,read)`, `markAllRead()`, `clearCache()`. Queries carry limit/cursor/category/unreadOnly; pages return items, authoritative global unreadCount and optional nextCursor. Each notification has ID, title/message, category, finite epoch-ms timestamp, read state and optional validated application-local link.

`MockNotificationProvider` is development-only in-memory data. `ApiNotificationProvider` uses the central configured API base, the existing cookie/CSRF/correlation interceptor and validated unknown response data. It rejects malformed pages/duplicate IDs, bounds page size and text, and drops unsafe external/protocol-relative/control-character/login links. Production never silently falls back to fixtures.

`NotificationStore` coordinates cancellation/generation fencing, incremental loading, mutations and error feedback. Read/unread changes are reflected only after provider confirmation and refetch. It clears records/count/filter state on user or notification-access change; stale list/mutation responses cannot restore another user's records. Profile edits do not reset the same user's notifications. There is no browser storage persistence and no realtime transport.

`SmartNotificationBell` exposes the header button, visible unread badge, expanded state, outside/Escape dismissal, and an `opened` output used to close the profile disclosure. `SmartNotificationPanel` accepts a region `label` (the header uses ?Recent notifications? to distinguish it from the full listing) and displays timestamped, categorized updates with read/unread, mark-all, links, paging and loading/empty/error/retry. `SmartNotificationCenter` adds filters and the page header. Header and center share query/filter state and unread totals. Timestamps are explicitly UTC. The development scenario page supplies its own store/provider so error/empty/loading scenarios do not disturb the header.

Backend contract still required:

| Endpoint (relative to configured API base) | Contract |
| --- | --- |
| `GET /notifications?limit=10&cursor=...&category=approval&unreadOnly=true` | `{items: SmartNotification[], unreadCount: number, nextCursor?: string}`; limit1–50; global user-scoped count |
| `PATCH /notifications/read` | `{ids: string[], read: boolean}`; confirm success with 204; backend validates ownership and permitted IDs |
| `POST /notifications/read-all` | Empty object; mark only current user's records read; 204 |

Enforce secure HttpOnly session, CSRF on writes, authorization/ownership, bounded queries, no-store/private data rules and safe error/correlation policy from the Phase 2 BFF contract. Real category/deep-link permissions remain backend-authoritative. No broadcast/SSE/WebSocket contract is assumed. Real notification persistence is not implemented in the frontend.

## Wizard and stepper APIs

`WizardStep`: unique `id`, `title`, optional `description`, `optional`, and `validate({signal}): boolean|string|Promise<boolean|string>`. A returned string is display-safe validation text; exceptions become generic failures. `WizardConfiguration` has immutable `steps`, `submit({signal})`, optional `saveDraft()` and `dirty()`. The final step is completion; the penultimate step is review/Finish. Supply at least two uniquely identified steps.

`SmartStepper`: `steps`, `current`, `completed`, `errorStep`, `disabled`, `orientation: horizontal|vertical`, `label`; `selected` output. It uses a named nav/ordered list, `aria-current=step`, explicit completed/error/optional text and native buttons. Future steps cannot be jumped to. Mobile stacks the steps.

`SmartWizard`: `config`, `orientation`; `stepChanged`, `submitted`, `draftSaved` outputs; projected current-step content. It exposes `current`, `completed`, `skipped`, `errorStep`, `busy`, `error`, `message`, `complete`, plus `next(skip?)`, `previous()`, `goBack(index)`, `saveDraft()`, `requestLeave()`. Previous navigation is allowed; Next validates before advancing. Optional steps can be explicitly skipped. Finish revalidates required prior steps before calling submit, and completion appears only after confirmation. Validation/submission/draft states block duplicate navigation; projected controls are inert while processing. Rejected submissions stay on Review for retry. Destruction aborts pending validation/submission and ignores late results. Step changes focus the new heading.

```html
<smart-wizard [config]="configuration" (stepChanged)="step.set($event)">
  <!-- Project the typed reactive controls for step(). -->
</smart-wizard>
```

Implement `UnsavedAware.requestLeave()` in routed consumers and attach exported `UnsavedChangesGuard`; delegate to the wizard. Dirty leave asks ConfirmationService; clean/draft-saved/completed leave proceeds, busy leave is blocked. Auth-expiry consumers should allow forced logout and rely on destruction/AbortSignal cleanup, as the demonstration does. A beforeunload listener asks the browser to warn on dirty/busy refresh/close; browsers control whether they display that prompt.

The application-registration example uses Phase 3 fields for Basic Information, Ownership (async unavailable-owner validation), optional Configuration, Review and Completion. Drafts are memory snapshots; successful save only marks pristine if values still match the saved snapshot. Failed draft saves retain dirty data. Real draft storage, application registration, owner lookup, idempotency/versioning and backend validation remain consuming-feature integrations; the generic engine contains none of that business logic.

## Safe error presentation

`ErrorPresenter.describe(unknown)` maps typed ApiError validation/authentication/authorization/network/server/timeout failures to stable user-facing copy. Unknown errors become generic application feedback. Only bounded alphanumeric/hyphen correlation IDs are shown. Raw Error.message, stacks, HTTP bodies and internal details are never rendered. `SafeApplicationErrorHandler` replaces default raw global-error presentation without console logging sensitive exceptions. Production telemetry is an explicit future integration, not a console dump.

`ErrorPresentationInterceptor` is opt-in through `new HttpContext().set(PRESENT_API_ERROR,true)`. It wraps the auth interceptor so normalized errors can be shown globally; forms, notification stores and providers keep their own inline feedback to avoid duplicate messages. Existing 401 expiry and 403 access-denied behavior remains. TimeoutError is classified distinctly from offline/network failures. No mutation retry was added.

## Verification and remaining limits

Verification executed on 15 November 2026:

| Check | Command | Result |
| --- | --- | --- |
| Production build | `npm.cmd run build` | Passed with no warnings; initial 396.43 kB raw / 108.92 kB estimated transfer |
| Strict app/spec types | `npm.cmd run typecheck` | Passed |
| Unit/component tests | `npm.cmd run test:unit` | 73 passed, including 23 added Phase 4 tests |
| Browser regressions | `npm.cmd run test:e2e` | 53 passed, including 12 added Phase 4 scenarios; saved snapshots compared without updating |
| Production isolation | `npm.cmd run verify:production-auth` | 22 JavaScript assets checked; mock credentials, fixtures, configuration hook and development showcases excluded |
| Whitespace | `git diff --check` | No whitespace errors; LF/CRLF notices only |

The new confirmation, error toast, desktop/mobile wizard and mobile notification-dropdown baselines were generated and visually inspected. Shell/profile baselines were intentionally updated for the functional unread badge. Header geometry/palette, navigation and Phase 2 authentication behavior remain covered by regression tests. Automated accessibility/reflow checks cover the new pages and confirmation dialog at 390px/1672px in both themes; existing shell tests cover 320/390/768/1024/1672px. The final notification landmark and added dropdown snapshot checks were also run separately.

 Tests cover toast timers/stack/actions, dialog queue/focus/critical cancellation/typed reason/async retry, progress counts/cancellation, notification DTO/read/filter/paging/stale-user clearing, wizard validation/optional/revalidation/draft/retry/unsaved navigation/destruction, keyboard focus, responsive reflow, automated accessibility and visual regressions. Previous phase suites remain required.

Full manual screen-reader and cross-browser/native-dialog review remains outstanding; automated axe is not a complete WCAG conformance claim. Native dialog top-layer behavior is required. Dynamic component injection/custom HTML dialogs, realtime notifications, durable draft storage and real background operation transport are intentionally outside these APIs. Screenshot interaction gaps and platform differences remain provisional as described above. No Phase 5 implementation or new full UI dependency is included.
