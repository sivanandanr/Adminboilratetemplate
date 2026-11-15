# Phase 3 ? Enterprise reusable UI components

## Run and import

Run `npm.cmd start` in `frontend`, sign in with the Phase 2 development administrator and open `/dev/components`. The route is lazy, development-only and protected by `showcase.view`; the reader fixture is denied. No production route or mock provider is enabled. No Phase 4 dialog/notification/wizard service was started.

Import standalone controls from `src/app/shared/ui` (or their individual modules), and import `ReactiveFormsModule` in the consuming component. The existing Button directive, PageHeader, FeedbackState, Icon and permission directive remain authoritative; aliases/re-exports extend them without duplicate implementations. No UI framework or additional dependencies were installed. Native controls/dialog provide browser keyboard/focus primitives, so Angular CDK is not necessary for this increment.

## Shared form contract

All value controls compose `SmartValueAccessor<T>` through hostDirectives rather than inheriting a business/control base class. Shared inputs: `id` (generated unless supplied), `label`, `placeholder` where relevant, `hint`, `required=false`, `disabled=false`, `readonly=false`, `errors: readonly string[]=[]`. Set disabled through the FormControl whenever possible; native disabled state combines both inputs. Reactive Forms valueChanges/statusChanges remain the outputs: model writes/reset/disable do not echo user edits; user edits call change and blur calls touched. No credentials or form values are persisted by these controls.

Use typed `FormControl<T>` and validators in the consuming form. Required is also an accessible indicator/native constraint; do not rely on it instead of server validation. Errors appear when the control is dirty/touched, or when explicit `errors` are supplied. Mark all controls touched on submission. Built-in feedback maps required/email/min/max/minlength/maxlength/pattern/dateRange; unknown validator keys get a generic message (supply `errors` for domain text). Readonly controls stay focusable and reject mutation. Specialized callbacks/data providers are feature-owned; shared controls do not inject HTTP or business services.

## Visual evidence and normalized tokens

Reviewed references: UI-037 for labelled configuration fields, password visibility, textarea, number input, radio/toggle and right-aligned Save; UI-246 for regular 36px controls, tabs, page actions, grid toolbar and cards. Both originals were inspected at full size in this phase. The full 253-image inventory and M/E/P provenance remain in `docs/design/SCREEN_MANIFEST.md`, `DESIGN_ANALYSIS.md`, and `DESIGN_TOKENS.md`.

Palette: existing `--iam-control-fill`, `--iam-control-border`, `--iam-surface`, `--iam-primary`, `--iam-accent`, `--iam-text`, `--iam-border` and semantic tints. Typography: existing font scale and Arial fallback. Spacing: existing 4/8/12/16/24/32px scale. Regular input height36px, radius6px and card radius10px remain estimates/normalized choices, not recovered CSS declarations. UI-037 is visibly denser and uses a darker purple; the library deliberately uses UI-246 regular density and primary as recorded in Phase 1.

The only additional semantic alias is `--iam-error-text: var(--iam-text-secondary)`; danger feedback uses source-derived `--iam-danger-fill` and `--iam-icon-danger` with dark copy. Danger buttons use navy text on pastel danger fill, including dark mode, to avoid white-on-pastel contrast failure. No generic Tailwind palette was added. Focus/hover/disabled mappings, custom popup behavior, drawer geometry and mobile behavior remain provisional because static screenshots do not specify them. Date/select/file native chrome varies by OS. No pixel-perfect fidelity is claimed; new visual baselines detect implementation regressions only.

Action recipes: page and grid actions align right; form Cancel precedes primary Save at the bottom right (UI-037); row actions are compact trailing buttons; dialog Cancel precedes confirmation; wizard Previous/Next use opposite ends. The latter two are positioning containers only, with varying screenshot orders documented in Phase 1; they do not introduce general dialogs or wizards.

## Autocomplete provider contract

```ts
interface SmartSearchRequest { query: string; limit: number; cursor?: string; }
interface SmartSearchResult<T> { items: readonly T[]; nextCursor?: string; }
interface SmartDataProvider<T> {
  search(request: SmartSearchRequest): Observable<SmartSearchResult<T>>;
}
```

The effect unsubscribes the previous debounced request on query, input/provider/config change, closure, disabled/readonly or destruction. An HttpClient-backed provider therefore cancels obsolete requests. A stale producer cannot overwrite current results. Local sources are filtered without a remote provider. Remote page sizes are clamped to 1?50, result DOM to 100; consumer providers must enforce paging on the server. Load more uses nextCursor; users refine the search after 100. Retry/paging restore input focus before changing popup actions. Selection values are string keys; remote restored labels can be provided through selectedLabels. Errors are generic and never render raw backend content.

Accessibility follows the [W3C combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) and [hover/focus guidance](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html). Automated axe checks are supplemented by behavior tests; they do not replace manual assistive-technology review.

## Component API and examples

Every form component below uses the shared form inputs, CVA lifecycle and control tokens above. Every layout/action component uses the same surface/text/spacing/focus tokens. All examples are copyable from the development showcase; define the referenced typed FormControl/arrays/callbacks in the consumer.

### SmartTextbox

Text/email/tel/url/search input.

- Inputs/outputs: type, autocomplete, maxlength, icon; common form inputs.
- Form contract: string | null.
- Accessibility: Native textbox, associated label, hint and validation IDs.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Native text entry; no input mask.
- Tests: forms.spec.ts: model write/edit/reset/disabled/readonly/validation.

```html
<smart-textbox label="Name" [formControl]="name" [required]="true" icon="UserRound" />
```

### SmartPassword

Password entry and visibility toggle.

- Inputs/outputs: autocomplete; common form inputs.
- Form contract: string | null.
- Accessibility: Native password input; visibility button has pressed state and explicit accessible name.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Visibility is local UI state; never stores or validates credentials.
- Tests: forms.spec.ts: visibility preserves model.

```html
<smart-password label="Password" [formControl]="password" autocomplete="current-password" />
```

### SmartTextarea

Multiline descriptions.

- Inputs/outputs: rows, maxlength; common form inputs.
- Form contract: string | null.
- Accessibility: Native textarea keyboard and label semantics.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No rich text or HTML injection.
- Tests: forms.spec.ts: textarea form changes.

```html
<smart-textarea label="Description" [formControl]="description" [rows]="4" />
```

### SmartNumberInput

Nullable numeric entry.

- Inputs/outputs: min, max, step; common form inputs.
- Form contract: number | null.
- Accessibility: Native number input and spinner keyboard behavior.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Empty/non-finite input maps to null. Add Validators.min/max in the consuming form; no locale currency formatting.
- Tests: forms.spec.ts: decimal and clearing.

```html
<smart-number-input label="Retries" [formControl]="retries" [min]="1" [max]="10" />
```

### SmartDropdown

Single option selection.

- Inputs/outputs: options: readonly {value:string,label:string,disabled?:boolean}[]; common form inputs.
- Form contract: string | null.
- Accessibility: Native select keyboard; readonly prevents pointer/keyboard changes without disabling focus.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: String keys; no searchable popup. Empty string is reserved for no selection.
- Tests: forms.spec.ts: dropdown and readonly.

```html
<smart-dropdown label="Role" [formControl]="role" [options]="roles" />
```

### SmartAutocomplete

Searchable local or paged remote selection.

- Inputs/outputs: items, provider, displayField, valueField, disabledField, multiple, minLength, debounceMs, pageSize, selectedLabels; common form inputs.
- Form contract: string | readonly string[] | null.
- Accessibility: Combobox/listbox, active descendant, ArrowUp/Down, Home/End, Enter, Escape; Tab reaches clear/retry/paging actions.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Use stable unique string keys and selectedLabels for restored remote values. Result DOM is capped at 100; refine query after the cap. Popup is anchored within the control, so overflow:hidden ancestors can clip it. No virtual scrolling or arbitrary free text.
- Tests: autocomplete.spec.ts and components.spec.ts: stale results, cancellation, minimum length, retry, keyboard, multiple, paging and bounds.

```html
<smart-autocomplete label="Owner" [formControl]="owner" [provider]="users" [minLength]="2" />
```

### SmartMultiSelect

Multiple local choices.

- Inputs/outputs: options, size; common form inputs.
- Form contract: readonly string[] | null.
- Accessibility: Native multi-select keyboard; hint describes Ctrl/Command selection.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Native list appearance varies by OS; use multiple autocomplete for search.
- Tests: forms.spec.ts: array model.

```html
<smart-multi-select label="Roles" [formControl]="selectedRoles" [options]="roles" />
```

### SmartCheckbox

Boolean acknowledgement.

- Inputs/outputs: checkedLabel, uncheckedLabel; common form inputs.
- Form contract: boolean | null.
- Accessibility: Native checkbox; Space toggles, readonly cancels activation.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Use Validators.requiredTrue for mandatory acknowledgement. No indeterminate state.
- Tests: forms.spec.ts: checkbox integration and readonly.

```html
<smart-checkbox label="Accept policy" [formControl]="accepted" />
```

### SmartRadioGroup

Choose one mutually exclusive option.

- Inputs/outputs: options; common form inputs.
- Form contract: string | null.
- Accessibility: Labelled radiogroup/fieldset, native radio arrows and Space; readonly is applied to group.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No orientation styling API; options stack vertically.
- Tests: forms.spec.ts: radio selection and readonly; browser axe.

```html
<smart-radio-group label="Security" [formControl]="security" [options]="options" />
```

### SmartToggle

Boolean Yes/No, Enabled/Disabled or On/Off switch.

- Inputs/outputs: onLabel, offLabel, confirmChange: (next:boolean)=>boolean|Promise<boolean>; common form inputs.
- Form contract: boolean | null.
- Accessibility: role=switch, checked/readonly/busy states; native button Space/Enter.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No automatic persistence. Consumer supplies confirmation UI/service; rejected/failed/stale confirmations do not change model. No general dialog framework added.
- Tests: forms.spec.ts: accepted/rejected/pending confirmation and disabled/readonly.

```html
<smart-toggle label="Enabled" [formControl]="enabled" onLabel="Enabled" offLabel="Disabled" [confirmChange]="confirm" />
```

### SmartDatePicker

ISO calendar-date selection.

- Inputs/outputs: min, max; common form inputs.
- Form contract: string | null (YYYY-MM-DD).
- Accessibility: Native date picker, browser keyboard and calendar interaction.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Native calendar/locale presentation is platform-dependent; no timezone conversion or branded calendar popup.
- Tests: forms.spec.ts: ISO date changes; browser form test.

```html
<smart-date-picker label="Effective date" [formControl]="date" min="2026-01-01" />
```

### SmartDateRangePicker

Start/end date composition.

- Inputs/outputs: min, max; common form inputs; export smartDateRangeValidator.
- Form contract: SmartDateRange | null: {start:string,end:string}.
- Accessibility: Two named native date inputs sharing hint/error feedback.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Add smartDateRangeValidator; incomplete/reversed ranges are invalid. Date-only comparison assumes ISO strings. Native calendar remains platform-dependent.
- Tests: forms.spec.ts: incomplete/reversed/valid ranges.

```html
<smart-date-range-picker label="Validity" [formControl]="range" />
// new FormControl<SmartDateRange | null>(null, smartDateRangeValidator)
```

### SmartFileUpload

Select, validate and clear local files.

- Inputs/outputs: accept, multiple, maxBytes (10 MiB default), maxFiles (10); common form inputs.
- Form contract: readonly File[] | null.
- Accessibility: Native labelled file chooser; rejection feedback, filenames and clear button.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Never uploads. accept/type/size checks are UX only; backend must revalidate content, extension, MIME, size and authorization. Programmatic File[] values display names but cannot populate native FileList.
- Tests: forms.spec.ts: file size/type rejection, acceptance/clear; browser selection.

```html
<smart-file-upload label="Files" [formControl]="files" accept=".txt" [maxBytes]="1024" />
```

### SmartFormField

Compose label, hint and errors around a native or specialized input.

- Inputs/outputs: forId required, label, hint, required, errors: readonly string[]. No outputs.
- Form contract: Not a value accessor..
- Accessibility: forId links label and deterministic hint/error IDs. Consumer must bind aria-describedby/aria-invalid.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Do not wrap an already-labelled smart control in another field.
- Tests: forms.spec.ts: accessible linkage; browser axe.

```html
<smart-form-field forId="code" label="Code" hint="Unique code"><input id="code" class="smart-input" aria-describedby="code-hint" /></smart-form-field>
```

### SmartFieldError

Render validation messages.

- Inputs/outputs: id, errors: readonly string[]. No outputs.
- Form contract: Not a value accessor..
- Accessibility: Messages are text-only role=alert.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Consumers should reveal errors after touch/submit rather than on initial render.
- Tests: forms.spec.ts: required feedback; browser axe.

```html
<smart-field-error id="code-error" [errors]="errors" />
```

### SmartFormSection

Titled form fieldset and responsive two-column grid.

- Inputs/outputs: title required, description. Content projection.
- Form contract: Projects typed form controls..
- Accessibility: Native fieldset/legend.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: One column below 768px; nested section layouts remain consumer responsibility.
- Tests: components.spec.ts: mobile/desktop reflow and screenshots.

```html
<smart-form-section title="Configuration"><smart-textbox label="Name" [formControl]="name" /></smart-form-section>
```

### SmartButton

Native actions with variants, icons and loading.

- Inputs/outputs: label required; type, variant primary/secondary/outline/ghost/danger; size small/medium/large; icon, iconAfter, iconOnly, tooltip, disabled, loading. pressed: void output.
- Form contract: Use type=submit inside a form..
- Accessibility: Native button; icon-only uses label as accessible name; busy suppresses activation.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: tooltip input uses browser title; use SmartTooltip for custom focus/hover content. Projecting icons on existing button[iamButton] remains supported.
- Tests: layout.spec.ts: busy suppression; browser action states.

```html
<smart-button label="Save" variant="primary" icon="Plus" [loading]="saving()" (pressed)="save()" />
```

### SmartButtonGroup

Group related actions.

- Inputs/outputs: label required. Content projection.
- Form contract: Not a value accessor..
- Accessibility: Named role=group; children remain native Tab stops.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No roving toolbar navigation because this is a group, not role=toolbar.
- Tests: components.spec.ts: action screenshot and axe.

```html
<smart-button-group label="Record actions"><smart-button label="Edit" /><smart-button label="Archive" /></smart-button-group>
```

### SmartSplitButton

Primary command with alternative action disclosure.

- Inputs/outputs: label required; primaryId, actions: readonly SmartAction[], disabled, loading. selected: string action ID.
- Form contract: Not a value accessor..
- Accessibility: Native disclosure button with expanded state, Tab to action buttons, Escape closes and restores trigger focus.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Disclosure group, not ARIA menu. No nested actions or global overlay positioning.
- Tests: layout.spec.ts: busy primary/trigger; browser disclosure and selection.

```html
<smart-split-button label="Create" [actions]="actions" (selected)="run($event)" />
```

### SmartActionToolbar

Enforce page/grid/row/form/dialog/wizard action alignment.

- Inputs/outputs: label; placement: page|form|grid|row|dialog|wizard. Content projection.
- Form contract: Form recipe: Cancel then primary Save on right..
- Accessibility: Named role=group with normal Tab sequence.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Does not execute/save anything. Wizard container only; no Phase 4 wizard implementation.
- Tests: components.spec.ts: action positions/reflow and screenshot.

```html
<smart-action-toolbar placement="form" label="Form actions"><smart-button label="Cancel" /><smart-button label="Save" variant="primary" /></smart-action-toolbar>
```

### SmartPermission

Existing permission-aware structural wrapper.

- Inputs/outputs: iamCan: Permission. No outputs.
- Form contract: Not a value accessor..
- Accessibility: Unavailable controls are removed from DOM.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Existing CanDirective alias. UI convenience only; server authorization is mandatory.
- Tests: Phase 2 auth tests plus protected showcase/permission controls.

```html
<smart-button *iamCan="'admin.configure'" label="Configure" (pressed)="configure()" />
```

### SmartCard

Bordered near-white surface.

- Inputs/outputs: title; content projection.
- Form contract: May contain form controls..
- Accessibility: Optional named section with h2.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Does not fetch data or manage state.
- Tests: components.spec.ts: visual and accessibility coverage.

```html
<smart-card title="Configuration"><p>Panel contents</p></smart-card>
```

### SmartBadge

Text category/status label.

- Inputs/outputs: tone: neutral|success|danger|warning|info; projected content.
- Form contract: Not a value accessor..
- Accessibility: Explicit text; no color-only meaning or automatic live announcements.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Category meaning must be chosen by consumer. Dark text on sampled pastel tints in dark mode.
- Tests: components.spec.ts: all tones, dark/light axe.

```html
<smart-badge tone="success">Active</smart-badge>
```

### SmartStatusIndicator

Status badge with icon and text.

- Inputs/outputs: label required, tone, icon.
- Form contract: Not a value accessor..
- Accessibility: Icon decorative; visible label conveys status.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No health polling or status business logic.
- Tests: components.spec.ts: status semantics and contrast.

```html
<smart-status-indicator label="Failed" tone="danger" icon="CircleAlert" />
```

### SmartTabs

Keyboard-selectable section tabs.

- Inputs/outputs: tabs: readonly SmartTab[] required; label, active; changed: string ID.
- Form contract: Not a value accessor..
- Accessibility: Roving tabindex, ArrowLeft/Right/Home/End skipping disabled tabs, selected tab labels projected panel.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Consumer switches projected panel based on changed; no route navigation or async fetching. Single active content region.
- Tests: layout.spec.ts: roving keyboard; browser tabs and axe.

```html
<smart-tabs label="Details" [tabs]="tabs" (changed)="active.set($event)"><p>{{ active() }}</p></smart-tabs>
```

### SmartAccordion

Native expandable section.

- Inputs/outputs: title required, expanded; content projection.
- Form contract: Not a value accessor..
- Accessibility: Native details/summary Enter/Space and disclosure state.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: expanded initializes/updates native state; user toggles are native, no group single-open coordination.
- Tests: components.spec.ts: keyboard toggle and axe.

```html
<smart-accordion title="Advanced options"><p>Settings</p></smart-accordion>
```

### SmartTooltip

Supplementary text on hover/focus.

- Inputs/outputs: smartTooltip: string required. No outputs.
- Form contract: Not a value accessor..
- Accessibility: Focusable trigger, role=tooltip, description IDs preserved, hoverable tip, Escape dismissal, persistence while focused/hovered.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Text only; no interactive content or essential-only instructions. Fixed placement bounds viewport; repositions on resize/scroll.
- Tests: layout.spec.ts: description preservation/Escape; browser focus tooltip.

```html
<button iamButton smartTooltip="Reload records">Reload</button>
```

### SmartDivider

Separate related content.

- Inputs/outputs: No inputs/outputs.
- Form contract: Not a value accessor..
- Accessibility: Native hr separator.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Horizontal only.
- Tests: components.spec.ts: composed accessibility scan.

```html
<smart-divider />
```

### SmartEmptyState

Existing feedback primitive exposed through shared/ui.

- Inputs/outputs: kind: loading|empty|error required; title required; description, actionLabel; retry: void output.
- Form contract: Not a value accessor..
- Accessibility: Error uses alert; loading/empty uses status; loading aria-busy; action native button.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Alias of FeedbackState, both iam-feedback-state and smart-empty-state selectors.
- Tests: Existing components.spec.ts unit retry test; browser showcase.

```html
<smart-empty-state kind="empty" title="No records" actionLabel="Create" (retry)="create()" />
```

### SmartSkeleton

Static loading placeholder.

- Inputs/outputs: width, height (CSS lengths), label.
- Form contract: Not a value accessor..
- Accessibility: Decorative block hidden; screen-reader text communicates loading.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: No shimmer/motion. Pass trusted design CSS sizes, not untrusted arbitrary style values.
- Tests: components.spec.ts: accessibility/reflow.

```html
<smart-skeleton width="60%" height="24px" label="Loading name" />
```

### SmartLoadingOverlay

Block interaction while an area loads.

- Inputs/outputs: loading, label; content projection.
- Form contract: Projects form controls; does not change their values..
- Accessibility: Covered content becomes inert; overlay status and aria-busy.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Consumer must move focus out before blocking a currently focused region if needed. Does not issue requests.
- Tests: layout.spec.ts: inert activation; browser overlay.

```html
<smart-loading-overlay [loading]="loading()"><p>Content</p></smart-loading-overlay>
```

### SmartPageHeader

Existing page-title/icon/action composition.

- Inputs/outputs: title required, description, icon; page-meta/page-actions slots.
- Form contract: Not a value accessor..
- Accessibility: h1 hierarchy; actions remain native controls.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Alias of existing PageHeader; both iam-page-header and smart-page-header selectors. Avoid multiple h1 headers on a page.
- Tests: Existing shell tests and screenshots; showcase reflow.

```html
<smart-page-header title="Administration" icon="Settings"><smart-button page-actions label="Create" variant="primary" /></smart-page-header>
```

### SmartBreadcrumb

Navigable page ancestry.

- Inputs/outputs: items: readonly SmartCrumb[] required; label.
- Form contract: Not a value accessor..
- Accessibility: Labelled nav/ordered list, final aria-current=page; separators decorative.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Application-local router paths only; do not pass unvalidated external destinations. Shell retains its existing compact breadcrumb composition.
- Tests: components.spec.ts: axe and responsive composition.

```html
<smart-breadcrumb [items]="crumbs" />
```

### SmartDrawer

Reusable modal side panel.

- Inputs/outputs: title required, open; closed: void request output. Content projection.
- Form contract: Can project form controls..
- Accessibility: Native dialog focus containment/inert background; close button, Escape/backdrop requests, return focus, body scroll lock.
- Styling: shared control tokens for forms; surface/border/spacing/type/accent/status tokens for composition. No feature palette.
- Limits: Consumer must set open=false on closed. One shared drawer at a time; not a global overlay/dialog service. No Phase 4 framework.
- Tests: layout.spec.ts: modal state/cleanup; browser focus, Escape, axe and mobile.

```html
<smart-drawer title="Details" [open]="open()" (closed)="open.set(false)"><p>Record details</p></smart-drawer>
```

## Verification and remaining gaps

Final verification (15 November 2026):

| Check | Executed command | Result |
| --- | --- | --- |
| Production build | `npm.cmd run build` | Passed; initial 326.25 kB raw / 93.84 kB estimated transfer; no build warnings |
| Strict app/spec checks | `npm.cmd run typecheck` | Passed |
| Unit/component suite | `npm.cmd run test:unit` | 50 passed |
| Full browser regression | `npm.cmd run test:e2e` | 41 passed, including 9 new component scenarios |
| Production isolation | `npm.cmd run verify:production-auth` | 20 JavaScript assets checked; neither development showcase/fixtures included |
| Whitespace | `git diff --check` | No whitespace errors; existing LF/CRLF notices only |

The full ordinary Playwright run compared saved snapshots without updating them. New form/action baselines were separately generated and inspected; they are not proof of exact reference fidelity. Automated axe/reflow passed at 390px and 1672px in both themes, including the modal drawer. Existing shell checks cover 320/390/768/1024/1672px and prior authentication/session flows.

 Coverage includes CVA writes/reset/disabled/touched/errors, number/null, local/remote selection, stale requests/unsubscribe/minimum length/retry/multiple/result cap, confirmation state, date-range validation, file validation, loading actions, tabs, tooltip descriptions, drawer cleanup, protected development routing, desktop/mobile light/dark accessibility/reflow and visual snapshots. Existing Phase 1/2 suites remain regression checks.

Remaining integration/design limits: dedicated approved calendar/autocomplete/tooltip/mobile/drawer interaction specifications and exact fonts/logo remain unavailable; native browser control chrome differs from raster references. Full manual screen-reader and cross-browser testing remains outstanding. Real upload endpoints, scanning/storage, remote directory search and persistence belong to consuming features/BFF; none are fabricated here. The repository has no configured lint script, so strict TypeScript and Angular template checks are used. No broad dependency remediation or Phase 4 work is included.

The isolated form screenshots hide the unrelated shell skip link during capture; keyboard behavior remains covered by shell/navigation tests. This avoids fixed-position content from the surrounding shell appearing in tall cropped component captures.
