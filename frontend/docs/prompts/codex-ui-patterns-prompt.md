# Prompt for Codex: add the IAM Portal UI patterns to the frontend boilerplate

Paste everything below the line into Codex, with this repository open.

---

## Context

This repository is the frontend boilerplate for an IAM (identity governance) portal. Add a shared set of UI patterns taken from our approved IAM Portal prototype. Every feature screen will then look and behave the same way.

**Hard rules**
1. **Keep the existing fonts.** Don't change font families, sizes or weights already set in the boilerplate.
2. **Use the boilerplate's colors.** Map the meanings below onto the boilerplate's existing palette or theme tokens. Never hard-code a hex value inside a component. If a meaning has no matching token, add one in the theme file with a comment.
3. **Use the boilerplate's stack.** Use its framework, component library, icon set, state management and folder structure. If it already has a component library (such as Clarity, Angular Material, PrimeNG, MUI or Fluent), build these patterns on top of it. Don't add a second UI library. Add a small dependency only if there's no reasonable way without one, and say why.
4. **Don't break existing pages, routing or authentication.** These are shared building blocks plus one demo page.
5. **Light and dark themes** must both work if the boilerplate supports them. Every pattern must work at 390 px wide with no sideways scroll.
6. **Accessibility:** keyboard use everywhere, visible focus, a correct role for every element, and `aria-label` on icon-only buttons. Respect `prefers-reduced-motion`.

## Step 0: plan first

Before writing code, inspect the repository. Then create `docs/ui-patterns-plan.md` with:
- the framework, component library, theme or token files, icon set and router you found
- a table mapping each meaning below to the boilerplate token or color you will use
- where each new component, service or guard will live
- anything in this prompt that conflicts with the boilerplate, and how you'll handle it

Then implement.

## 1. Meaning-based color tokens

Create semantic tokens, such as CSS custom properties or theme variables, mapped to the boilerplate palette. Components use only these.

| Token | Used for | Pick from the boilerplate |
|---|---|---|
| `create` | Create, Add, New, Submit, Request, Register, Publish, Start | Its success or green |
| `update` | Update, Save, Edit, Continue, Retry, Confirm, Send, Ask | Its primary or brand color |
| `approve` | Approve, Keep, Accept, Stay signed in | A teal or a second success shade, distinct from `create` |
| `reject` | Reject, Delete, Remove, Disable, Suspend, Logout, Report | Its danger or red |
| `withdraw` | Withdraw | Its warning or amber, dark enough for white text |
| `cancel` | Cancel, Close, Back, Discard | Its neutral or grey |
| `ok`, `warn`, `bad`, `info`, `mute` | Status badges, toasts, alerts, dialog headers | Its success, warning, danger, info and neutral, each with a light background variant |

Every text and background pair must reach a contrast of at least 4.5:1, in both themes.

## 2. App layout, footer and scrolling

Rework the app shell to this layout. Keep the boilerplate's existing header contents, logo, menu items and routes. Only change their arrangement and scrolling.

**Shell structure, top to bottom, filling the window (`100dvh`, with `100vh` as a fallback):**

| Part | Rules |
|---|---|
| Header | About 48 px tall, in the boilerplate's header or brand color. Holds the logo and product name, global search, theme toggle and the user menu. It never scrolls. On small screens its items wrap. |
| Loading bar | 3 px, directly under the header. Shown only while a page or its data loads (section 7). |
| Offline banner | Directly under the loading bar, only when the server can't be reached (section 7). |
| Body | A row: side navigation on the left and the main content area on the right. It takes all the remaining height. |
| Footer | A thin bar, about 30 px, always at the very bottom of the window. Small muted text: copyright on the left, and version or environment on the right. Panel background with a 1 px top border. It never scrolls away. |

**Scrolling rule: the browser page itself never scrolls on desktop.** The side navigation and the main area each scroll on their own (`overflow: auto` with `min-height: 0` on the flex children). The header and footer always stay visible.

**Side navigation**
- About 248 px wide, panel background, with a 1 px divider on the right. It scrolls on its own.
- Menu groups have small uppercase headers. Each group can be expanded and collapsed, and all are expanded by default.
- The selected item has a light accent background, a 3 px accent bar on its left edge, and bold text.
- A collapse button switches to an icons-only rail, about 56 px wide, with a tooltip for each item. It can also be closed fully.
- Remember the rail and closed state, and which groups are collapsed, in `localStorage`, wrapped in try/catch.

**Main area**
- Padding of 12 px top and bottom and 20 px left and right. Sections are stacked with a 14 px gap.
- At the top, a **breadcrumb** in small muted text, linking back to the parent page.
- Then the **page header**: a 40 px tinted icon tile, the page title, and a one-line description.
- Then the content.

**Single-table pages (list pages)**
- The table card fills the remaining height of the main area, so the page fits the window with no outer scroll.
- The card's top bar uses a tinted header background and holds search, filters and the table actions.
- **Only the table body scrolls,** inside the card. The table header row is sticky at the top.
- Wide tables scroll sideways inside the card. The page itself never scrolls sideways.
- **The pager is sticky at the bottom of the card,** so it always sits just above the footer. It shows "Showing 1–10 of 248", a rows-per-page choice, and previous and next buttons.

**Forms and the action bar**
- The form's action bar is **frozen at the bottom of the main area,** just above the footer: `position: sticky; bottom: 0`, with the panel background and a 1 px top border.
- The **Unsaved changes** label is at its left. The buttons are at its right: the secondary actions, then Cancel or Close, then the one solid main button.
- The form content scrolls above it. The buttons are never scrolled out of sight.

**Details side panel**
- It opens from the right over the content: up to 560 px wide, full height, with a dimmed backdrop.
- It has a header (an icon tile, the title, a close button), a body that scrolls on its own, and a sticky footer with its actions.
- Esc closes it, focus is trapped while open, and focus returns afterwards. On mobile it's full width.

**Dialogs:** at most 85% of the window height. The header and footer stay fixed, and only the dialog body scrolls.

**Cards and tabs**
- Cards: panel background, 1 px border, 4 px radius, and an optional tinted card header.
- Tabs: underlined, with a 3 px accent underline on the selected tab. When there are too many to fit, the tab row scrolls sideways.
- Grids of cards or tiles use `repeat(auto-fit, minmax(…, 1fr))`, so they wrap.

**Phone and tablet, 760 px and narrower**
- The side navigation closes by default and opens from the header menu button.
- The body stacks vertically, and **the page scrolls normally as one column.** The main area stops scrolling on its own.
- Single-table pages stop filling the window. The table keeps its sideways scroll inside the card, and the pager stays sticky at the bottom of the screen.
- The action bar stays sticky at the bottom of the screen.
- Nothing scrolls sideways except inside a table box.

**Stacking order (z-index), lowest to highest:**
1. Content
2. Sticky table headers, pagers and action bars
3. Header
4. Details side panel
5. Dialogs
6. Block UI overlay
7. Idle warning
8. Toasts

Define these as named tokens in one place.

## 3. Buttons

Build one `Button` component used everywhere.

- **Variant follows meaning:** `create | update | approve | reject | withdraw | cancel`. Choose it from the label's verb. Add a helper that picks the variant from the label, for example "Delete…" gives `reject`. Allow an explicit override.
- **Style:** `solid` or `outline`. **Each screen or button group has exactly one solid main button.** All others are outlined, including table row actions. `cancel` is always outlined.
- **Icon:** every button has a leading icon from the boilerplate icon set. Icon-only buttons need `aria-label` and a tooltip.
- **Label:** a short verb first, in sentence case ("Save changes", not "OK").
- **Shape:** square corners. Use one token, `--btn-radius`, default `0`, so it can be changed in one place.
- **Sizes:** `md` is the default, at least 36 px tall. `sm` is for tables, at least 30 px. Touch targets on mobile are at least 44 px.
- **States:** hover, focus-visible, pressed, disabled and loading.
  - Disabled shows *why* in a tooltip, such as "Not supported by this connector".
  - Loading shows a small spinner, keeps the width and prevents double clicks.
- **Selected or added state:** an item already chosen shows an `Added` toggle button, not a red Remove. Something the person already has is plain text, not a button.
- **Footer order:** at the bottom right, the secondary actions, then **Cancel or Close right next to** the main button, and the main button last.

## 4. Status badges

Build a `StatusBadge`: rounded pill, tinted background, 1 px border in the tone color, one short label. Tones: `ok`, `warn`, `bad`, `info`, `mute`. Risk uses the same component: Low is `ok`, Medium is `warn`, High and Critical are `bad`. A badge is never clickable. Never show status as plain text or a dot.

## 5. Toasts

Build a `ToastService` and a toast outlet in the app shell.

- **Types:** `success` (ok), `info`, `warning`, `error`. Each has a colored square icon tile on the left, a bold title, a one-line message and a close button (`aria-label="Dismiss"`).
- **Position:** top right, just below the header, 16 px from the edge. On mobile, full width with 16 px gutters.
- **Stack:** at most 3 visible. A new one pushes out the oldest.
- **Timing:** success and info close after 5 s. Warning and error close after 9 s. Pause the timer while the toast is hovered or focused.
- **Accessibility:** the container is `aria-live="polite"`. Errors use `role="alert"`.
- **Motion:** a short slide or fade-in, about 180 ms. None with reduced motion.
- **API:** `toast.success(title, message?)`, `info`, `warning`, `error`.
- **Use:** show a toast after every completed action. Words say what happened and, if needed, what to do next.

## 6. Dialogs

Build a `DialogService` with a promise-based API. Every dialog has a header, a body and a footer.

- **Header:** a colored band by tone (`info`, `ok`, `warn`, `bad`) with white text, an icon in a lightly tinted square, and the title.
- **Footer:** a light neutral background, with buttons at the right following the button rules: **Cancel** next to the main button.
- **Types:**
  - `confirm`: for approve, reject, delete, remove and withdraw. **These actions always ask first**, everywhere in the app.
  - `confirmWithReason`: for destructive or sensitive actions. It has a required reason text box with a validation message under the field. The reason is returned to the caller, so it can go to the audit trail.
  - `info`: one Close button.
  - `form`: a custom component inside the dialog.
- **Behaviour:**
  - Focus is trapped, and the first field or the main button gets focus.
  - **Esc and the backdrop act as Cancel,** except for blocking dialogs.
  - Focus returns to the element that opened the dialog.
  - Only one dialog shows at a time. Background scroll is locked.
  - Sizes are `sm`, `md` and `lg`. On mobile the dialog is full width.
- **API:** `const r = await dialog.confirm({ tone, title, text, okLabel, okVariant, reason?: 'required' | 'optional' })` returns `{ ok: boolean, reason?: string }`.

## 7. Block UI and progress

Build a `BlockUiService` and an overlay in the app shell.

- **Use it for saves and other writes.** For page navigation and data loading, use a **slim 3 px loading bar** under the header instead, so people can keep reading.
- **Overlay:** a dark, semi-transparent backdrop over the whole app, with a centered card. The card has:
  - an `info` dialog header with a spinner and the title, such as "Saving your changes" or "Creating the account"
  - a progress bar: determinate when steps or percent are known, indeterminate otherwise
  - an optional step list showing done, current and next
  - a footer note: "Please keep this window open."
- **Slow operations:** after 8 s, add "This is taking longer than usual. You can keep waiting, and nothing is lost."
- **No flicker:** show the overlay only if the operation takes longer than 300 ms. Once shown, keep it for at least 400 ms.
- **Activity:** while blocked, the idle timer is treated as active (see section 8).
- **Accessibility:** `role="alertdialog"`, `aria-busy="true"`, and the progress bar has `role="progressbar"` with value attributes.
- **API:** `await blockUi.run(title, promiseOrFn, { steps?: string[] })`. It closes on success or failure. On failure, show an error toast with the message.
- **Network banner:** when the browser goes offline or the API can't be reached, show a red bar under the header: "Can't reach the server. Your work on this page is safe, but changes can't be saved yet. Retrying in N seconds." It has a **Retry now** button and is removed when the connection is back.

## 8. Idle timeout

Build an `IdleService`, started after sign-in.

- **Settings:** idle limit, default 15 minutes, and warning time, default 60 seconds. Read them from environment or app config, or from the server's session settings if the boilerplate has them.
- **Activity:** pointer, keyboard, scroll and touch events reset the timer. Throttle them to once per second. Share activity across browser tabs with `BroadcastChannel`, falling back to `localStorage`, so working in one tab keeps the others alive.
- **Warning dialog:** a blocking `alertdialog` over a dark red backdrop. It contains:
  - a `bad` header: "Are you still there?"
  - the text "You'll be logged out for security because there's been no activity."
  - a large countdown number in the `bad` color, `aria-live="assertive"`, gently pulsing unless reduced motion is set
  - a draining progress bar
  - if the current page has unsaved changes: "Your unsaved changes will be lost."
  - buttons: **Logout** (`reject`, outline) and **Stay signed in** (`approve`, solid, focused)
- **Timeout:** sign out through the boilerplate's auth service, clear app state, and go to the sign-in page with the message "You were logged out because there was no activity. Sign in to continue."
- **The browser's unload warning must not appear** for an idle logout.
- **Stay signed in** also refreshes the server session or token, if the auth service supports it.
- Add a comment that the server session timeout is the real security control. This timer only helps the person.

## 9. Cancel, Close and unsaved changes

Build a dirty-state helper, such as a form mixin, hook or directive, plus a route guard.

- **Footer label:** **Close** when nothing has changed, **Cancel** when the form has unsaved changes.
- **Unsaved label:** show an "Unsaved changes" label with an edit icon at the left of the footer or action bar while dirty.
- **Leaving inside the app:** route change, tab switch inside the page, Cancel or logout while dirty opens a `warn` dialog. Title "Discard your changes?", text "What you entered here will be lost.", buttons **Keep editing** (`cancel`) and **Discard** (`reject`, solid).
- **Refresh or closing the browser** while dirty uses the browser's own `beforeunload` warning. Register it only while something is dirty.
- **Saving successfully clears the dirty state,** and the label goes back to Close.
- **Optional:** highlight changed fields subtly, with a left accent bar or a tinted background.

## 10. Demo page

Add a route, for example `/ui-patterns`, linked from the dev or admin menu. It shows every pattern working:
- all button variants and states, including disabled with a reason and loading
- status badges and risk badges
- buttons that fire each toast type
- each dialog type, including a reason that is required
- block UI: a quick save, a save with steps, and a slow save
- an idle demo with a 30 s limit and 15 s warning, set from a dropdown on the page
- an offline banner simulation
- a small form showing Close and Cancel, the Unsaved changes label, the leave-page dialog and the refresh warning
- a long list page with 200 sample rows, to show the table filling the window, the sticky header row and the sticky pager
- a long form, to show the frozen action bar
- a button that opens the details side panel

## 11. Tests and documentation

- **Unit tests:**
  - toast queue limit and timings
  - dialog promise results, including the required reason
  - block UI delay and minimum display time
  - idle countdown, reset on activity, logout at zero, and sync across tabs (mock the clock)
  - the dirty guard on route change
  - the variant helper that picks a button color from the label
- **End-to-end smoke test** on the demo page, if the boilerplate has e2e set up.
- **`docs/ui-patterns.md`:** when to use each pattern, its API with an example, and the color mapping table from Step 0.

## Acceptance checklist

- [ ] Fonts are unchanged. No component has a hard-coded color. Light and dark both work.
- [ ] Every button has an icon and a meaning-based color, and each screen has exactly one solid main button.
- [ ] Approve, reject, delete, remove and withdraw always ask for confirmation. Destructive actions can require a reason.
- [ ] Toasts: 4 types, top right, at most 3, with the timings above, pausing on hover.
- [ ] Dialogs trap focus, Esc means Cancel, and focus returns afterwards.
- [ ] Block UI appears only after 300 ms, shows progress and steps, shows the slow message after 8 s, and keeps the session alive while blocked.
- [ ] The idle warning counts down, Stay signed in resets the timer in every tab, and timeout logs out with a message.
- [ ] Leaving a dirty form asks first, refresh shows the browser warning, and saving clears it.
- [ ] The offline banner shows and clears.
- [ ] The header and footer stay in place on desktop, and only the navigation, main area and table body scroll.
- [ ] On list pages the pager sits just above the footer, and the table header row stays visible while scrolling.
- [ ] On forms the action bar stays visible, with Cancel or Close next to the main button.
- [ ] At 760 px and narrower, the page scrolls as one column, the navigation is closed by default, and there is no sideways scroll outside tables.
- [ ] Every pattern works at 390 px wide with keyboard only.
- [ ] The existing app still builds, existing tests pass, and the new tests pass.

## Finish with

A short summary: what was added and where, the color mapping you chose, anything you couldn't do and why, and how to open the demo page.
