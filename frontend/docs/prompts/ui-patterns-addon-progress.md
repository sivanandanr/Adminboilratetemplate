# Add-on prompt for Codex: server-call progress dialog and background tasks

Run this **after** the main UI patterns work is finished and committed. It changes the block UI from section 4 of the main prompt, and adds one progress bar component and a background tasks panel.

Save this file as `docs/prompts/ui-patterns-addon-progress.md`. Add these images to `docs/prompts/ui-patterns-ref/`:
- `ref-3-saving.png` (replaces the old one)
- `ref-5-tasks-running.png`
- `ref-6-tasks-finished.png`
- `ref-7-upload-progress.png`
- `ref-8-unknown-length.png`

---

## Context

The SmartIAM app already has the UI patterns from `docs/prompts/ui-patterns.md`, including a block UI overlay. This add-on changes that overlay into an automatic **server-call progress dialog** with real progress. It also adds a reusable **ProgressBar** and a **background tasks panel**.

## Hard rules

1. **Change nothing visual that already exists.** Fonts, colors, radius, shadows, the sidebar, the top bar, the app footer, tabs, buttons and cards all stay as they are.
2. **Reuse what was built in the main task:** the BlockUi service and overlay, the toast service, the dialog service, the tokens and the stacking tokens. **Extend them. Don't create parallel versions.**
3. **No new UI library.** Keyboard access, `aria` roles and `prefers-reduced-motion` all apply.
4. The images in `docs/prompts/ui-patterns-ref/` show the target. Where your real tokens differ from them, your tokens win.

## Step 0: plan, then stop

Write a short plan in `docs/ui-patterns-addon-plan.md`:
- what exists today (the BlockUi service, the HTTP client and interceptors, how calls are made)
- what you'll change, and which files you'll touch
- how screens that already call `blockUi.run` will keep working

Then **stop and wait for my approval.**

## Part A: server-call progress dialog (change the existing block UI)

**Automatic for server calls.** Add an HTTP interceptor (or the boilerplate's equivalent) that drives the existing block UI overlay.
- **Writes** (POST, PUT, PATCH, DELETE, uploads): the dialog shows automatically.
- **Reads** (GET): the existing thin loading bar shows instead. A read can opt in with `{ blockUi: true }` when the screen can't be used until it returns, such as opening a record to edit.
- **Per-call options:** `{ blockUi: false }` to turn it off, and `{ title, message, steps }` to set the text. The default title is "Please wait".
- **Several calls at once share one dialog.** It closes when the last call finishes.
- **Timing:** show it only after 300 ms, and keep it at least 400 ms.
- **Errors:** close the dialog and show an error toast with the server message.
- **Timeout:** use the HTTP timeout. When it's reached, show the error toast "The server didn't respond. Your changes weren't saved."
- **Existing calls:** screens that already call `blockUi.run(...)` must keep working, and must not show two dialogs at once.

**What the dialog shows** (see `ref-3-saving.png`, `ref-7-upload-progress.png` and `ref-8-unknown-length.png`):
- Header: a spinner and the title, such as "Saving your changes" or "Uploading evidence.pdf".
- A one-line message, such as "Sending your changes to the server."
- **Progress, in one of three kinds:**
  - **Real percentage** from upload or download progress events: the bar fills, with "4.8 of 10 MB" on the left and "48%" in bold on the right.
  - **Steps** when the call has known stages: the bar moves by step, with "Step 2 of 3" and the percentage, and a step list with done, current and next.
  - **Unknown length:** an indeterminate moving bar with no percentage. Never show a fake percentage.
- After 8 s: "This is taking longer than usual. You can keep waiting, and nothing is lost."
- Footer note: "Please keep this window open."
- No close button. It closes only when the call ends.
- While it shows, the idle timer counts as active.
- Accessibility: `role="alertdialog"`, `aria-busy="true"`, and the bar has `role="progressbar"` with value attributes. The unknown-length bar has `aria-label` only.

## Part B: ProgressBar component

**One `ProgressBar` component**, used by the dialog above, by inline progress and by the background tasks panel. Replace any one-off bar from the main task with it.
- It's an 8 px rounded track in a light neutral, with a rounded fill.
- Fill color by state: brand purple while running, green when completed, red when failed, gray when cancelled.
- It can be determinate (a percentage) or indeterminate (a moving fill, still under reduced motion).
- An optional line under it shows counts and time left on the left, such as "3,353 of 10,000 rows · about 8s left", and the percentage in bold on the right.
- It has `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label`.

**Inline progress:** use it inside a card for work on that screen, such as uploading or checking a CSV. Show the bar under the file name, with a status pill and **Cancel**. Nothing else is blocked. When it finishes, the bar turns green and a result summary replaces the counts.

## Part C: background tasks panel

For long jobs people shouldn't wait for: exports, imports, bulk changes and discovery runs. See `ref-5-tasks-running.png` and `ref-6-tasks-finished.png`.
- A white card at the bottom right, above the app footer, with the app's radius and shadow. The header reads "Background tasks (2 running)" and has a minimise button.
- One row per task: the title, a status pill (Running in purple, Completed, Failed, Cancelled), the ProgressBar with counts, time left and percentage, and its actions:
  - running: **Cancel**, which asks first: "Cancel this task?" with **Keep running** and **Cancel task**
  - completed: **Download** (solid primary) when there's a file
  - failed: **Retry** (outlined purple)
- When a task finishes or fails, show a toast too.
- The clear (×) button appears only when nothing is running, and removes the finished rows.
- The panel stays across page changes. Keep task state in a service, and reload it from the server on refresh.
- On phones it's full width at the bottom, above the footer.
- **Stacking:** above content and sticky parts, below dialogs, the progress dialog, the idle dialog and toasts.
- Tasks run on the server. Show progress by polling or a push channel. They don't keep the session alive, and they keep running after logout.
- **API:** `tasks.start({ title, unit, total, run })` returns a handle with `progress(done)`, `complete(result)`, `fail(message)` and `cancel()`.

## Part D: demo page, tests and docs

- **Add to `/ui-patterns`:**
  - a save with steps
  - a 10 MB upload with real percentage
  - a read with unknown length that opts in to the dialog
  - two calls at once, showing one dialog
  - a failing call that shows an error toast
  - an inline CSV upload
  - background tasks: an export that completes with Download, an import that can be cancelled, and a job that fails with Retry
- **Unit tests:**
  - the interceptor opens the dialog for writes but not reads
  - opt-in and opt-out work
  - concurrent calls share one dialog
  - the 300 ms delay and 400 ms minimum
  - an error closes the dialog and shows a toast
  - ProgressBar states
  - the task service: start, progress, complete, fail, cancel, and surviving a route change
- **Docs:** update `docs/ui-patterns.md` with the new options and APIs.

## Acceptance checklist

- [ ] Existing pages look the same as before this add-on.
- [ ] Every write shows the progress dialog after 300 ms, with real percentage, steps, or an unknown-length bar. It never shows a fake percentage.
- [ ] Several calls share one dialog, errors close it with an error toast, and `blockUi: false` turns it off.
- [ ] Screens that already used `blockUi.run` still work, with no double dialogs.
- [ ] One ProgressBar component is used by the dialog, inline progress and background tasks.
- [ ] Background tasks can be cancelled (with a confirmation), retried and downloaded, and they survive page changes.
- [ ] Keyboard only and phone width work, and the build and all tests pass.

## Finish with

What changed and where, before and after screenshots of the demo page, and anything you couldn't do.
