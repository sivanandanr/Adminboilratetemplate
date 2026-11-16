# Prompt for Codex: apply the UI guidelines to the reusable components in `ui/`

Save this file as `docs/prompts/ui-components.md`. It uses the two prompts you already have as the detailed specification:
- `docs/prompts/ui-patterns.md`
- `docs/prompts/ui-patterns-addon-progress.md`

Keep both, with the images in `docs/prompts/ui-patterns-ref/`.

---

## Context

This app has a library of reusable UI components in the `ui/` folder (`ui/index.ts` exports them). Pages build their screens from these components.

A previous attempt put the new behaviour **inside pages**. That was wrong. **All behaviour and styling rules belong in the reusable components and shared services.** Pages only use components and pass options.

The detailed rules for each pattern are in `docs/prompts/ui-patterns.md` (the main prompt) and `docs/prompts/ui-patterns-addon-progress.md` (the progress add-on). The images in `docs/prompts/ui-patterns-ref/` show the target. This prompt says **which component each rule goes into.**

## Hard rules

1. **Change components, not pages.** Work in `ui/*.ts`, plus shared services and the app shell or layout. Edit a page only in the last part, to replace page-level code with the component, and only to remove duplication.
2. **Keep the SmartIAM look.** Fonts, colors, radius, shadows and spacing stay as the components have them today. New visual pieces use existing tokens only.
3. **Keep every public API backward compatible.** Add new inputs and options with defaults that keep today's behaviour, unless a guideline requires a change. If a breaking change is unavoidable, list it in the plan first.
4. **One implementation per pattern.** If two files do the same job (for example `modal.ts` and `dialogs.ts`, or `toast.ts` and `notifications.ts`), make one build on the other. Never keep two versions.
5. **Every changed component gets its spec updated or added** (`*.spec.ts`), next to the existing specs.
6. **Export** every new component or service from `ui/index.ts`.
7. **No new UI library.** Keyboard access, visible focus, `aria` roles and `prefers-reduced-motion` all apply.

## Step 0: audit, then stop

Create `docs/ui-components-audit.md` with one row per file in `ui/`:

| Component | What it does today (API) | Guideline that applies | Gap | Planned change | Breaking? |
|---|---|---|---|---|---|

Also list:
- the table, grid and pagination components, the app layout or shell, and the HTTP client, if they're outside `ui/`
- any page that contains its own toast, dialog, overlay, progress, dirty-check or idle code. These get replaced in Part 6.

Then **stop and wait for my approval.**

## Part 1: actions, buttons, dialogs and toasts

| File | Apply |
|---|---|
| `actions.ts` (and the button component, wherever it lives) | Main prompt §1. Variants by meaning: primary, secondary, `danger`, `success`, `warning`. One solid primary per group. An icon and a verb label on every button. Disabled with a reason tooltip. A loading state that keeps the width and blocks double clicks. Footer order: secondary actions, then Cancel or Close next to the primary at the right. A slot at the left for the "Unsaved changes" pill. |
| `modal.ts` | Main prompt §3. Header (tone icon and title), body, footer. Focus trap, Esc and backdrop act as Cancel (except blocking modals), focus returns, one at a time, at most 85% of the window height with only the body scrolling. |
| `dialogs.ts` | A promise-based service built **on `modal.ts`**: `confirm`, `confirmWithReason` (with a required reason and an error message under the field), `info`. Approve, reject, delete, remove and withdraw must use it. |
| `toast.ts` | Main prompt §2. Four types, top right, at most 3, 5 s or 9 s timing, pause on hover or focus, `aria-live`, and `role="alert"` for errors. API: `toast.success`, `info`, `warning`, `error`. |
| `notifications.ts` | If it's the bell or notification centre, leave its purpose alone, but make it reuse the toast styles and tokens. If it duplicates toasts, merge it into `toast.ts` and keep the old export as an alias. |

## Part 2: server calls, progress and connection

| File | Apply |
|---|---|
| `progress.ts` | Add-on Part B. **The single ProgressBar component:** determinate or indeterminate, states (running, completed, failed, cancelled), an optional counts, time-left and percentage line, and `role="progressbar"`. Every other bar uses it. |
| `block-ui.ts` | Add-on Part A. The **server-call progress dialog**, built on `modal.ts` and `progress.ts`, with three kinds: real percentage, steps, unknown length. It has a slow message after 8 s, "Please keep this window open", and no close button. It shows after 300 ms and stays at least 400 ms. Several calls share one dialog. |
| HTTP interceptor (new, next to the HTTP client) | Add-on Part A. Writes open the dialog automatically. Reads show the top loading bar, with an opt-in. Per-call options: `{ blockUi, title, message, steps }`. Errors and timeouts close the dialog and show an error toast. |
| Loading bar (new, or inside the layout) | Main prompt §4. A 3 px bar under the top bar, for reads and page changes. |
| `offline-banner.ts` | Main prompt §4. The exact message, a retry countdown, **Retry now**, and it hides when back online. Mounted once in the layout, not per page. |
| Background tasks (new `tasks.ts` and panel) | Add-on Part C. The bottom-right panel, using `progress.ts`, with Cancel (confirmed through `dialogs.ts`), Download and Retry. Its state is held in a service and survives page changes. |
| `file-upload.ts` | Show progress with `progress.ts`, which gives real upload percentage, and a status pill (Uploading, Checking, Ready, Failed) with Cancel. Show the size and type limits as help text. Errors appear under the field with how to fix them. |

## Part 3: form controls and unsaved changes

| File | Apply |
|---|---|
| `form-field.ts` | The wrapper every control uses: a label, `*` for required, help text, and an error under the field that says how to fix it. Validation runs on submit and then on change. Disabled shows the reason. |
| `textbox.ts`, `textarea.ts`, `number-input.ts`, `password.ts`, `dropdown.ts`, `radio-group.ts`, `checkbox.ts`, `toggle.ts`, `date-picker.ts`, `date-range-picker.ts` | Use `form-field.ts` for the label, required mark, help and error, so they all behave the same. **Toggle** is only for changes that take effect at once. **Checkbox** is for anything that needs Save. **Password** never pre-fills, never logs its value, and has no copy button. **Date pickers** support min and max. Where used for access dates, "Valid from" defaults to today. |
| `autocomplete.ts`, `multi-select.ts` | Main prompt guidelines: typing `*` shows all results, you can search within the results, and results are paged. Selected items show as chips with remove. Keyboard navigation and `aria-activedescendant`. |
| `forms.ts` (dirty tracking) | Main prompt §6. Track the dirty state per form. Expose `isDirty` to `actions.ts`, so footers show the "Unsaved changes" pill and **Cancel** instead of **Close**. Register `beforeunload` only while dirty. Saving clears it. |
| Route guard (new, next to the router) | Main prompt §6. Leaving a dirty form shows "Discard your changes?" through `dialogs.ts`, with **Keep editing** and **Discard**. |

## Part 4: layout, navigation and containers

| File | Apply |
|---|---|
| Layout or app shell (see `layout.spec.ts`) | Main prompt §7. Fixed sidebar, top bar and app footer. Only the content scrolls. Mount the toast outlet, the progress dialog, the loading bar, the offline banner, the background tasks panel and the idle dialog **once here**. Define the stacking tokens. |
| App footer (new, or inside the layout) | Main prompt §7. Copyright with the current year, version and environment from config, and the links. |
| Table, grid and pager (wherever they live) | A sticky header row, sideways scroll inside the card, and a pager pinned to the bottom of the card. |
| `drawer.ts` | A details side panel: header with icon, title and close, a body that scrolls on its own, a sticky footer, focus trap, Esc closes it, and full width on phones. If it has a form, it uses the dirty guard. |
| `tabs.ts` | Keep the pill look. Scroll sideways when the tabs overflow, use `role="tablist"` with arrow-key navigation, and run the dirty guard when the tab changes inside a form. |
| `accordion.ts` | Optional "only one open at a time" for repeated items. A status pill per section (Complete, or Needs your input). |
| `breadcrumb.ts` | The last item is the current page and isn't a link. The parent link goes back to the parent page. |
| `display.ts` | If it shows status values, use one **StatusBadge** with the tones `ok`, `warn`, `bad`, `info` and `mute`, and risk mapped the same way. Add it if it's missing, and export it. |

## Part 5: idle timeout

A new session or idle service, mounted in the layout. Main prompt §5: 15 minutes with a 60 s warning by default, read from config, synced across browser tabs, a dialog built on `modal.ts` and `progress.ts`, Logout and Stay signed in, logout through the existing auth service, and the sign-in message.

## Part 6: replace page-level code, demo page and tests

- **Pages:** in every page listed in the audit, remove the page's own toast, dialog, overlay, progress, dirty-check or idle code, and use the components and services instead. Make no other change to pages.
- **Demo page:** `/ui-patterns` shows every component and pattern **using only the components**.
- **Tests:** run all specs. Add specs for each changed component: variants, disabled with a reason, loading, focus trap, Esc, dialog results, toast limits and timing, interceptor rules, ProgressBar states, the dirty guard, and idle sync across tabs.
- **Docs:** update `docs/ui-patterns.md` to explain each component's new inputs, with one example each.

## Acceptance checklist

- [ ] No page contains its own toast, dialog, overlay, progress, dirty-check or idle code. They all use `ui/` components or shared services.
- [ ] Each pattern has one implementation, exported from `ui/index.ts`.
- [ ] Existing component APIs still work, and any breaking change was approved in the plan.
- [ ] The look is unchanged apart from the new pieces, which use existing tokens.
- [ ] All the patterns work on every page without page-specific code: confirmations, toasts, the server-call progress dialog, the loading bar, the offline banner, background tasks, unsaved changes, idle timeout, the app footer and pinned pagers.
- [ ] Every changed component has a spec, and the build and all tests pass.

## Finish with

The audit table updated with what was done, the files changed, any breaking changes, and anything left open.
