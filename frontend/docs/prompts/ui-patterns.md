# Prompt for Codex (final): add IAM behaviour patterns without changing the SmartIAM design

Save this file as `docs/prompts/ui-patterns.md`. Save the reference images in `docs/prompts/ui-patterns-ref/`: your SmartIAM screenshot plus the preview images `ref-1-unsaved-toasts.png`, `ref-2-delete-reason.png`, `ref-3-saving.png`, `ref-4-idle.png`, `ref-5-tasks-running.png`, `ref-6-tasks-finished.png`, `ref-7-upload-progress.png` and `ref-8-unknown-length.png`. Then follow the steps in the reply. The images include the new app footer.

---

## Context

A previous attempt changed the look of this app (buttons, header, sidebar, tabs, footer). That was wrong. **The current SmartIAM design is the source of truth for every visual detail.** This task adds *behaviour* patterns only: toasts, dialogs and confirmations, block UI and progress, idle timeout, unsaved-changes protection, and the scrolling and sticky rules. Each new piece must look as if it was always part of SmartIAM.

## Reference images

`docs/prompts/ui-patterns-ref/` holds the current SmartIAM screen and four images of the target result: unsaved changes and toasts, the delete confirmation with a required reason, the saving overlay, and the idle warning. Match them. They were drawn from a screenshot, so where your real tokens differ (font, exact colors, spacing), **your real tokens win**.

## Hard rules

1. **Change nothing visual that already exists.** Fonts, colors, the purple brand, border radius, shadows, spacing, the dark sidebar, the top bar, page titles, pill tabs, filter chips, buttons, cards, status pills, list rows, pagination and the workflow builder all stay exactly as they are.
2. **Reuse the existing components and tokens.** If the app already has a Button, Badge, Tabs, Card, Modal or Pagination component, use it and extend it only with new options. Don't restyle it and don't create a parallel one.
3. **New components** (toast, dialog, block overlay, idle dialog, unsaved banner) are styled only with the app's existing tokens: the same radius, shadow, font weights, purple primary and neutral grays as the current cards and buttons.
4. **No new header and no sidebar changes.** The layout stays as it is today, except for the new app footer described in section 7.
5. **No new UI library.** Keep light and dark (if supported), keyboard access, visible focus, `aria` roles, and `prefers-reduced-motion`.
6. **Visual check:** before and after your changes, take screenshots of three existing pages, including Workflow Management and one list page. Any visible change to existing pages, other than the new sticky and scroll behaviour, is a bug you must fix.

## Step 0: plan, then stop

Create `docs/ui-patterns-plan.md` with:
- the framework, component library, theme or token files and icon set you found
- which existing components you'll reuse: button, badge, modal, pagination, tabs
- which new components you'll add, and which existing tokens they use
- the files you'll touch, and confirmation that no existing styles change

Then **stop and wait for my approval.**

## The SmartIAM design language (for new pieces only)

- **Page background:** a very light lavender gray. Content sits on white cards with rounded corners (about 12 px) and a soft shadow.
- **Primary:** the brand purple. A primary button is solid purple, rounded (about 8 px), with a leading icon and white text. A secondary button is white with a light gray border, an icon and dark text. Outlined purple is for actions like "Test Workflow".
- **Status pills:** small rounded pills with a soft tinted background. Green for Active, amber for Draft, gray for versions and neutral states, and red for failed or rejected.
- **Tabs and filters:** pill-shaped, with a filled purple pill for the active one.
- **List rows:** a rounded lavender icon tile, a bold title, a gray subtitle, a status pill and a kebab menu.
- **Pagination:** small rounded buttons, the active one filled purple, with "1–8 of 12" at the right.
- **Panel footer:** Cancel (white, outlined) next to the main action (solid purple), at the bottom right of the panel.

Match this exactly when building the new components below.

## 1. Button meaning (use the existing Button component)

Keep the existing button shapes. Add only these rules and options:
- **Primary action, whatever its verb:** the existing solid purple button. Each panel or screen has exactly one.
- **Secondary actions:** the existing white outlined button.
- **Destructive actions** (Delete, Remove, Reject, Disable, Suspend, Logout): add a `danger` variant to the existing button, using the existing radius, in the app's red. Solid red when it is the confirm button inside a dialog, outlined red elsewhere.
- **Approve in a decision panel:** add a `success` variant, in the app's green, solid only for the main Approve.
- **Withdraw:** a `warning` variant, outlined amber.
- **Every button has an icon and a short verb label.** Cancel or Close sits right next to the main button.
- **Disabled buttons show why** in a tooltip. A **loading state** shows a spinner, keeps the width and blocks double clicks.

## 2. Toasts

- Show them at the top right, just below the top bar.
- Each is a white card with the app's radius and shadow: a small colored icon circle or tile (green success, blue info, amber warning, red error), a bold title, a gray message and an × to close.
- At most 3 show at once. Success and info close after 5 s, warning and error after 9 s. The timer pauses on hover or focus.
- Use toasts for results ("Workflow saved", "Delete sent for approval"). Don't use them for questions. Questions use a dialog.
- Use `aria-live="polite"`, and `role="alert"` for errors.
- **API:** `toast.success | info | warning | error(title, message?)`.

## 3. Dialogs and confirmations

- Use the existing modal if there is one. Otherwise build one: a white card with the app's radius and shadow, a dimmed backdrop, a header with a tinted icon circle in the tone color and the title, a body, and a footer with Cancel plus the main button at the bottom right.
- **Approve, reject, delete, remove and withdraw always ask for confirmation** first.
- **Destructive or sensitive actions can require a reason:** a text box with an error message under it. The reason is returned to the caller for the audit trail.
- Focus stays inside the dialog. Esc and a backdrop click act as Cancel. Focus returns to where it was. Only one dialog shows at a time.
- **API:** `await dialog.confirm({ tone, title, text, okLabel, okVariant, reason?: 'required' | 'optional' })` returns `{ ok, reason? }`.

## 4. Server-call progress dialog (block UI), progress and loading

**The most important pattern in this section:** while the app waits for the server, show a **modal progress dialog** over the screen, so people can't double-submit or change data mid-call.

**Automatic for server calls.** Add an HTTP interceptor (or the boilerplate's equivalent) so the dialog appears without each screen wiring it up.
- **Writes** (POST, PUT, PATCH, DELETE, uploads): the dialog shows automatically.
- **Reads** (GET): the thin loading bar shows instead (see below). A read can opt in to the dialog when the screen can't be used until it returns, such as opening a record to edit.
- **Per-call options:** `{ blockUi: false }` to turn it off, and `{ title: 'Saving your changes', message, steps }` to set the text. The default title is "Please wait".
- **Several calls at once share one dialog.** It closes when the last call finishes.
- **Timing:** show it only if the call takes longer than 300 ms, and keep it at least 400 ms so it doesn't flicker.
- **Errors:** close the dialog and show an error toast with the server message. Nothing is lost on screen.
- **Timeout:** use the boilerplate's HTTP timeout. When it's reached, show "The server didn't respond. Your changes weren't saved." as an error toast.

**What the dialog shows,** as in the reference images:
- Header: a spinner and the title, such as "Saving your changes" or "Uploading evidence.pdf".
- A one-line message, such as "Sending your changes to the server."
- **Progress, in one of three kinds:**
  - **Real percentage** when the server or browser reports it, such as upload or download progress events: the bar fills, with "4.8 of 10 MB" on the left and "48%" in bold on the right.
  - **Steps** when the call has known stages: the bar moves by step, with "Step 2 of 3" and the percentage, and a step list with done, current and next.
  - **Unknown length:** an indeterminate bar that moves continuously, with no percentage. Never show a fake percentage.
- After 8 s: "This is taking longer than usual. You can keep waiting, and nothing is lost."
- Footer note: "Please keep this window open."
- No close button. The dialog closes only when the call ends.

The reference images `ref-3-saving.png` (steps), `ref-7-upload-progress.png` (real percentage) and `ref-8-unknown-length.png` (unknown length) show the three kinds.

### Other loading and progress rules

- **Saves and other writes:** a dimmed overlay with a centered white card. It has a spinner and title ("Saving your changes"), a purple progress bar (determinate when steps are known), an optional step list, and the note "Please keep this window open." After 8 s it adds "This is taking longer than usual. You can keep waiting, and nothing is lost."
  - Show it only after 300 ms, and keep it at least 400 ms.
  - While it is showing, the idle timer counts as active.
  - **API:** `blockUi.run(title, fn, { steps })`.
- **Page and data loading:** a thin 3 px purple bar along the top of the content area, just under the top bar. Use it for page changes, list selection, and quick actions like Test Workflow. Nothing is blocked, so people can keep reading.
- **Offline:** a slim red banner across the top of the content area: "Can't reach the server. Your work on this page is safe, but changes can't be saved yet. Retrying in N seconds." It has a **Retry now** button.

### 4a. Progress bar component and background tasks

**One `ProgressBar` component** is used everywhere: the block UI card, inline in cards, and in the background tasks panel.
- It looks like the block UI bar: an 8 px rounded track in a light neutral, with a rounded fill.
- Fill color by state: purple while running, green when completed, red when failed, gray when cancelled.
- It can be determinate (a percentage) or indeterminate (a moving fill, still under reduced motion).
- It has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.
- An optional line under it shows counts and time left on the left, such as "3,353 of 10,000 rows · about 8s left", and the percentage in bold on the right.

**Inline progress:** inside a card or form, for work tied to that screen, such as uploading or checking a CSV.
- Show the bar under the file name, with a status pill and **Cancel**.
- Nothing else on the page is blocked.
- When it finishes, the bar turns green and the result summary replaces the counts.

**Background tasks panel:** for long jobs that people shouldn't wait for, such as exports, imports, bulk changes and discovery runs.
- A white card at the bottom right, above the app footer, with the app's radius and shadow. The header reads "Background tasks (2 running)" and has a minimise button.
- One row per task: the title, a status pill (Running in purple, Completed, Failed, Cancelled), the ProgressBar with counts, time left and percentage, and its actions:
  - running: **Cancel**, which asks first ("Cancel this task?" with **Keep running** and **Cancel task**)
  - completed: **Download** (solid primary) when there's a file
  - failed: **Retry** (outlined purple)
- When a task finishes or fails, show a toast as well.
- The clear (×) button appears only when nothing is running, and removes the finished rows.
- The panel stays when people move to other pages. Keep task state in a service, and reload it from the server on refresh.
- On phones it's full width at the bottom, above the footer.
- **Stacking:** above the content and sticky parts, below dialogs, the block UI, the idle dialog and toasts.
- Background tasks run on the server. Show progress by polling or a push channel. They don't keep the person's session alive, and they keep running after logout.
- **API:** `tasks.start({ title, unit, total, run })` returns a task handle with `progress(done)`, `complete(result)`, `fail(message)` and `cancel()`.

The reference images `ref-5-tasks-running.png` and `ref-6-tasks-finished.png` show the panel.

## 5. Idle timeout

- **Defaults:** log out after 15 minutes of no activity, with a warning 60 seconds before. Both come from config.
- Pointer, key, scroll and touch events reset the timer, at most once per second. Activity is shared across tabs with `BroadcastChannel`, falling back to `localStorage`.
- **Warning dialog:**
  - a blocking dialog in the app style, with a red-toned icon
  - the title "Are you still there?" and the text "You'll be logged out for security because there's been no activity."
  - a large countdown with `aria-live="assertive"` and a draining progress bar
  - "Your unsaved changes will be lost." when the page has unsaved changes
  - buttons: **Logout** (outlined `danger`) and **Stay signed in** (solid primary, focused)
- **A save in progress never logs anyone out.** The block UI keeps the session active (section 4).
- **On timeout:** log out through the existing auth service and go to sign-in with the message "You were logged out because there was no activity. Sign in to continue." No browser leave-page warning appears for an idle logout.
- Add a code comment: the server session timeout is the real security control.

## 6. Cancel, Close and unsaved changes

- **Footer label:** the panel footer's secondary button says **Close** when nothing has changed, and **Cancel** when the form has unsaved changes.
- **Unsaved label:** while the form is dirty, a small amber "Unsaved changes" pill with an edit icon shows in the footer. In narrow panels it sits on its own line above the buttons. The buttons always stay at the right.
- **Leaving inside the app:** route change, tab change, list selection change, Cancel or logout while dirty asks first. Title "Discard your changes?", buttons **Keep editing** and **Discard** (`danger`).
- **Browser refresh or close** while dirty shows the browser's own warning (`beforeunload`), registered only while dirty.
- **Saving successfully** clears the dirty state.

## 7. App footer, scrolling and sticky behaviour

- **App footer (new):** a thin bar, about 32 px, at the bottom of the right-hand column, under the content area. It doesn't sit under the sidebar, which stays full height.
  - Left: `© 2026 SmartIAM. All rights reserved.` The year comes from the current date.
  - Right: the app version and environment from config, such as `v1.4.2 · Production`, then the links **Privacy**, **Terms** and **Help**.
  - Style: the page background, a 1 px top border in the existing border color, the existing small text size (12–13 px), and the existing muted text color. Links use the purple primary on hover. No new colors or fonts.
  - It's always visible on desktop and never scrolls away. Content, list pagers and panel footers all sit **above** it.
  - On phones it comes at the end of the page, after the content, and its items wrap.
- **Fixed parts:** the dark sidebar, the top bar and the app footer stay fixed. Only the content between the top bar and the footer scrolls. The sidebar scrolls on its own if its items overflow.
- **List panels** (like the workflow list): the list scrolls inside its card, and the **pagination stays pinned at the bottom of the card**.
- **Tables:** the header row is sticky. Wide tables scroll sideways inside their card, never the page.
- **Form and properties panels** (like Workflow Properties): the fields scroll, and the **Cancel / Save footer stays pinned at the bottom of the panel.**
- **Builder canvas:** scrolls and zooms inside its own area.
- **Dialogs:** at most 85% of the window height. Only the dialog body scrolls.
- **At 760 px and narrower:** keep whatever mobile behaviour the app already has. Panels stack, only tables scroll sideways, and the pinned footers stay visible at the bottom of the screen.
- **Stacking order:** content, then sticky parts, then the top bar and app footer, then dialogs, then the block overlay, then the idle dialog, then toasts. Define these as tokens.

## 8. Demo page, tests and docs

- **Demo page:** add a `/ui-patterns` page in the existing layout, styled like the other pages. It shows:
  - button variants and states, including disabled and loading
  - each toast type
  - each dialog type, including a required reason
  - quick, stepped and slow saves
  - an idle demo with a 30 s limit and 15 s warning
  - the offline banner
  - a long form with the pinned footer and the unsaved changes protection
  - a list with a pinned pager
  - the app footer, visible on the demo page like every other page
  - an inline CSV upload with progress
  - background tasks: an export that completes with Download, an import that can be cancelled, and a job that fails with Retry
- **Unit tests:** toast limits and timing, dialog results, block UI delay, idle countdown and sync across tabs, the dirty route guard.
- **Docs:** `docs/ui-patterns.md` with when to use each pattern and its API.

## Acceptance checklist

- [ ] Existing pages look identical to the before screenshots, apart from the scroll and pinned-footer behaviour.
- [ ] The new pieces use only existing tokens, with the same radius, shadow and purple.
- [ ] Each panel has one solid primary button. Destructive confirms are red. Approve, reject, delete, remove and withdraw always confirm first.
- [ ] Toasts, dialogs, block UI, the loading bar, the offline banner, the idle timeout and the unsaved-changes protection all work on the demo page.
- [ ] The sidebar, top bar and app footer stay fixed. The pagination and panel footers stay pinned above the app footer.
- [ ] The app footer shows copyright, version and environment, and the links, using existing tokens only.
- [ ] Every write to the server shows the progress dialog automatically after 300 ms, with real percentage, steps, or an unknown-length bar. Several calls share one dialog, and errors close it with an error toast.
- [ ] One ProgressBar component is used by the block UI, inline progress and the background tasks panel. Tasks can be cancelled (with a confirmation), retried and downloaded, and they survive moving between pages.
- [ ] Every pattern works with keyboard only, and at phone width with no sideways page scroll.
- [ ] The build passes, and existing and new tests pass.

## Finish with

What you added and where, the before and after screenshots, and anything you couldn't do.
