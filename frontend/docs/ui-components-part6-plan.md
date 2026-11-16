# UI Patterns showcase plan (revised scope)

User correction: focus exclusively on the UI Patterns showcase and existing reusable components. Business-page migrations are cancelled; the interrupted record/profile/router/form-service edits were restored to the committed Parts 1-4 baseline.

- Add a protected development-only /ui-patterns showcase in the existing shell, linked from the existing component catalog. Use only existing shared controls/services for behavior and presentation.
- Demonstrate action states, toast/dialog types, stepped/unknown/slow server feedback, real measured local-file work, background work with cancellation/retry/download, form dirty protection and a pinned table pager, drawer/tabs/accordion/status/breadcrumb patterns.
- Keep any demo work provider outside generic controls and isolated from production. Explain local demo work honestly; do not invent backend capabilities or production progress.
- Reuse the existing auth warning preview/session engine. No Part 5 redesign or business-page migrations. Review acceptance items and mark those prerequisite/deployment gaps explicitly.
- Add showcase tests, screenshots and usage/acceptance documentation; run unit/typecheck/build/browser/axe checks. Do not commit/push without a new instruction.
