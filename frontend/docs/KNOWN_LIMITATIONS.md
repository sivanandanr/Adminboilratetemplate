# Remaining issue register

This is a working frontend foundation and synthetic sample application, not a complete IAM product or deployed backend.

| Priority | Issue / boundary | Required follow-up |
| --- | --- | --- |
| Integration | Authentication, dashboard, notification, administration and export-job production endpoints are contracts | Implement and exercise secure BFF/session/CSRF, ownership/field authorization, error/concurrency and audit behavior with ASP.NET backend |
| Integration | Million-record exports remain backend contracts with ten-row mock samples | Implement durable authorized jobs, quotas, cancellation, expiry, idempotency and streaming downloads; load-test on backend |
| Integration | Part 2 task restoration needs a real owner-scoped task-list/retry contract; `TASK_API_CONFIG.endpoint` defaults to null | Configure the shipped adapter or supply `BACKGROUND_TASK_PROVIDER` after implementing the documented [task contract](BACKGROUND_TASK_CONTRACT.md). Existing export monitoring survives navigation but cannot rediscover jobs after refresh through its start/status-only contract |
| Integration | Upload progress presentation is transport-independent; no file-upload/scan endpoint is supplied | Bind actual HttpClient progress events and server check results to `FileUploadState`, enforce file limits/content checks on the server and wire cancellation to the real transfer |
| Integration | Coarse application permissions and presentation profiles | Map real employee/team/IAM/system grants, scope personal/team records, validate approval assignment/delegation and separation of duties server-side |
| Integration | Metadata-only workflow/provisioning configuration examples | Add domain schemas/validation and real designer/engine integration; current UI does not execute provisioning or evaluate policies |
| Design | Generic record fields and panels differ materially from full business screenshots | Obtain domain data/interaction requirements; implement feature-specific columns/sections without changing the shared screenshot-derived tokens |
| Design | Dashboard chart is a simple bar container with accessible table; role variants have no exact dedicated references | Approve role-specific compositions and chart semantics before adding a chart library |
| Design | Master-detail offers a bounded ten-record selector and a link to the full listing; relationships/history are explanatory, not populated backend data | Add advanced master-list paging/search if required; integrate domain relationships and audit history |
| Design | Dark/mobile/hover/focus/new interaction geometry is provisional; typography/font artwork cannot be recovered exactly | Review the capture/difference report and approve variants; no pixel-perfect claim |
| Quality | Automated axe/keyboard/reflow checks do not establish complete WCAG 2.2 AA or screen-reader conformance | Manual NVDA/JAWS/VoiceOver, browser/native-popover, forced-colors, 200–400% zoom, focus and contrast review with real content |
| Security | 18 moderate upstream dependency advisories, 0 high/critical at Phase 6 audit | Review Angular tooling chains and ExcelJS bundled uuid advisory; do not force unrelated major upgrades/downgrades as an assumed fix |
| Security | CSV formula mitigation changes dangerous strings and is not universal across spreadsheet resave workflows | Prefer typed XLSX; test real spreadsheet consumers; revalidate downstream imports |
| Performance | No heap timeline, long-duration soak or production API/load profile | Profile route churn, real data, large exports and backend latency; bounded DOM and subscription cleanup tests are narrower evidence |
| Product scope | Remaining navigation destinations outside the requested sample pages retain explicit placeholders | Implement separate feature phases for lifecycle, connector discovery, governance, delegation and detailed schedulers |
| Product scope | Existing `/administration` UI-246 composition still explicitly displays its original mock metrics/support panels | Replace its dashboard adapter with real administration analytics when the backend is ready; do not treat these as live health |
| Persistence | Development records/drafts/session are memory-only; reload resets them | Real data/drafts must use secure server persistence; never store auth tokens in browser storage |
| Tooling | No configured lint script | Add an agreed lint configuration in a focused task; strict TypeScript/templates and executed tests are the current gates |

No critical audit findings were suppressed, no commercial AG Grid feature was introduced, and no push/merge was performed. Backend behavior and manual audit work are not reported as completed frontend tests.


### Part 3 form adoption boundary

The reusable SmartForm/DirtyFormsService/DirtyFormGuard lifecycle is implemented and tested. Existing pages were deliberately not migrated during this component-only part. Their legacy callbacks and form copy (including the catalog native-multi-select help sentence) remain until Part 6. New form routes must import SmartForm and register DirtyFormGuard to receive the complete new lifecycle. Browser unload warnings use browser-controlled wording and require a prior user gesture; they are not data persistence. Server validation and authorization remain required.


### Part 4 deployment and migration boundary

Footer product/version/environment and links come from APP_METADATA. Privacy, Terms and Help destinations are intentionally unset until deployment supplies approved routes/HTTPS URLs; unavailable items do not navigate to invented documents. The generic table/grid/pager and shared chart-table containment are implemented. Feature-owned read-only summary presentation remains in its module and was reviewed for existing horizontal containment; full feature-page pattern migration remains Part 6. No idle redesign (Part 5) was included.
