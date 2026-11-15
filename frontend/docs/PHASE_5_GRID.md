# Phase 5 — SmartIAM enterprise data grid

Phase 6 integration update: known-total pagination now includes numbered page links, ellipsis and a primary current-page state. The grid is consumed by public administration sample routes using production API providers, so AG Grid and the lazy ExcelJS chunk now legitimately appear in production output. The Phase 5-only bundle figures and Previous/Next-only discrepancy below are retained as historical observations. See [current verification](PHASE_6_COMPLETION.md) and [comparison review](design/PHASE_6_COMPARISON.md).

## Run and scope

Run `npm.cmd start` from `frontend`, sign in as the documented development administrator and open:

| Route | Demonstration |
| --- | --- |
| `/dev/grid/client` | Whole-client-dataset query/sort/filter followed by pagination |
| `/dev/grid/server` | HttpClient POST adapter, cancellation, unknown totals, loading/empty/error scenarios |
| `/dev/grid/export` | Current/selected/filtered CSV and XLSX, explicit column selection, multi-sheet example and export jobs |
| `/dev/grid/selection` | Current-page selection, bulk confirmation and trailing row actions |

All four lazy routes require `showcase.view`, reuse the Phase 2 guards, and are absent from production. Employees, applications, accounts, entitlements and audit logs each generate 10,000 deterministic development records when selected. Only the current page is supplied to AG Grid. The in-browser server mock simulates a backend; it is not a scalability demonstration of a deployed API. No Phase 6 feature work was started.

## Dependencies and license review

Pinned `ag-grid-angular@36.3.0` and `ag-grid-community@36.3.0` have matching versions and MIT licenses. Registry peer metadata requires Angular core/common 20+, compatible with this Angular 20.3 project. The [official compatibility guide](https://www.ag-grid.com/angular-data-grid/compatibility/) and installed declarations were reviewed. Only `AllCommunityModule` is supplied locally to the component; no enterprise package, license key, Server-Side Row Model, Set Filter, enterprise menus or enterprise Excel API is used.

`exceljs@4.4.0` is MIT ([upstream license](https://github.com/exceljs/exceljs/blob/master/LICENSE)); the package declares Node 8.3+ and a bundled CommonJS browser entry. Its browser writing API was reviewed and is dynamically imported only when XLSX is requested. A small typed default-export adapter handles the CommonJS browser bundle. Real generated workbooks are parsed back in browser unit tests and Node/Playwright download tests, verifying dates, numeric/string cells and multiple sheets. ExcelJS adds a substantial lazy chunk; it is not on the shell's initial path. Dependency notices must be retained when distributing these packages.

Audit review: `npm.cmd audit --json` reported 18 moderate, 0 high and 0 critical advisories. These include Angular CLI tooling chains and ExcelJS→uuid8.3.2 ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), affected versions below 11.1.1). The installed ExcelJS source imports uuid.v4 for conditional-formatting identifiers; the reported buffer-boundary issue concerns v3/v5/v6 with an explicit buffer, and this exporter does not create conditional-formatting rules. This is a reachability observation, not a claim that the package/bundled dependency is remediated. The browser distribution vendors code, so merely overriding the Node uuid dependency would not establish browser-bundle remediation. Deprecated transitive packages also remain. No forced Angular major upgrade or suggested ExcelJS downgrade was applied; dependency remediation remains a documented integration risk.

## Architecture and public APIs

Import from `shared/grid` or individual files. Shared components contain no employee/application/account business rules and make no direct feature HTTP calls. Feature-owned column definitions are the read/search/export allowlist. Value accessors and predicates are trusted application code, never expressions compiled from server text.

| API | Responsibility |
| --- | --- |
| `SmartDataGridComponent<T>` | Standalone OnPush wrapper, Signals orchestration, typed schema, page-scoped selection, header sorting, filters, preferences and export dialog |
| `GridToolbarComponent` | Named, wrapping, right-aligned action group |
| `GridPaginationComponent` | Page size, accurate visible range, Previous/Next and known/unknown total presentation |
| `GridColumnPreferencesComponent` | Visible columns, widths and keyboard move-left/right controls; native header dragging/resizing also supported |
| `GridEmptyStateComponent` | Existing feedback composition for no matching records |
| `GridLoadingStateComponent` | Existing spinner/status composition |
| `GridErrorStateComponent` | Existing safe error/retry feedback composition |
| `ClientGridDataSource<T>` | Bounded in-memory search/filter/stable-sort, then page slice; exposes filteredRows for bounded export |
| `ServerGridDataSource<T>` | Same-origin paginated HTTP adapter with capability validation and consumer-supplied unknown-item decoder |
| `GridExportService` | Explicit opt-in export policy, bounded CSV/XLSX generation, safe names and downloads |
| `GridPreferencesService` | Versioned layout-only local preferences under a SHA-256 scope key; latest write wins |
| `GridExportJobComponent` / `ExportJobProvider` | Independent asynchronous backend-job lifecycle; production API and development mock adapters |

The component composes existing SmartButton, SmartTextbox, SmartDropdown, SmartAutocomplete, SmartCheckbox, SmartModal, badges, spinner, ToastService, ConfirmationService and ProgressService. Row and bulk actions emit typed events; the consuming feature decides permissions and work. The demonstration uses the existing confirmation dialog and a cancellable mock action, updates only fixture rows, then refreshes the grid. No business authorization is inferred from button visibility.

### Grid schema and component contract

`GridColumn<T>` requires `id`, `header`, `kind: text|number|date|status`, and `value(row): GridValue`. Optional: width, searchable, choice options, statusTone and `export:{allowed,value?,numberFormat?}`. `GridValue` is string/finite number/boolean/valid Date/null/undefined; arbitrary objects and formulas are rejected by export. The feature must not send sensitive data from its backend simply because a column is hidden.

Required component inputs: `gridId`, `title`, `source`, `columns`, `rowId`, `rowLabel`. Optional: `preferencesScope`, pageSizes (default 10/25/50/100), rowActions and bulkActions. Outputs: `rowAction:{id,row}`, `bulkAction:{id,rows}`, `selectionChanged: readonly T[]`. `refresh()` reruns the current request, retaining search/filter/sort/page and visible selected IDs when still available. Replacing the source resets query/selection and restores compatible layout preferences. Use immutable/stable input schema and data-source instances rather than reconstructing them in template getters.

```ts
interface Employee { id: string; name: string; status: string; }
const columns: readonly GridColumn<Employee>[] = [
  { id: 'name', header: 'Name', kind: 'text', value: row => row.name, export: { allowed: true } },
  { id: 'status', header: 'Status', kind: 'status', value: row => row.status,
    options: [{value:'Active',label:'Active'}], export: { allowed: true } },
];
const capabilities: GridCapabilities = {
  search: true, sortFields: ['name'], maxPageSize: 100,
  filters: { name: ['contains','equals'], status: ['equals','in'] },
};
const source = new ClientGridDataSource(employees, columns, capabilities);
```

```html
<smart-data-grid gridId="employees" title="Employees" [source]="source"
  [columns]="columns" [rowId]="rowId" [rowLabel]="rowLabel"
  [preferencesScope]="opaquePreferenceScope" [rowActions]="rowActions"
  (rowAction)="handleAction($event)" />
```

## Query, paging and selection behavior

```ts
interface GridRequest {
  pageNumber: number; // one-based
  pageSize: number;
  sorts: readonly {field: string; direction: 'asc'|'desc'}[];
  filters: readonly {field: string; operator: 'contains'|'equals'|'in'|'gte'|'lte';
    value: string|number|readonly string[]}[];
  searchText: string;
}
interface GridPage<T> {
  items: readonly T[];
  totalCount: number|null;
  pageNumber: number;
  pageSize: number;
  hasNextPage?: boolean; // required when totalCount is null
}
```

Global search is debounced 300ms and bounded 256 characters. Client search reads only declared searchable columns, not arbitrary object properties. Text, number, ISO date, status and multi-select filters are supported through feature capabilities. Multiple filters are ANDed; an `in` filter is an OR over its selected values. Reapplying the same field/operator replaces it; range comparisons can coexist. Filter chips use readable labels; remove-one and clear-all reset the page. Filter values/search are never persisted as preferences. ISO date comparisons/display use UTC calendar dates; consumers must define timezone semantics for timestamp fields.

The capability configuration explicitly whitelists sort fields, field/operator pairs and maximum page size. The UI offers only supported choices. Requests are bounded (five sorts, twenty filters, fifty values per multi-filter) and validated before transport. The backend must independently enforce resource-specific field/operator/type rules, search limits and authorization; the client does not imply support for every database filter.

The wrapper uses Community's client-side row model solely to render the supplied page. Both client and server sorting/filtering happen in the data source **before** pagination. Header sort events (including Shift multi-sort) are translated to descriptors; a neutral AG comparator prevents re-sorting only the loaded server page. Native column filters are disabled; status/multi-selection controls do not use enterprise Set Filter.

Effect cleanup unsubscribes obsolete requests; generation checks reject stale responses. Equal requests do not reload; Refresh/Retry explicitly do. Search/filter/page-size changes reset to page 1. A shrinking known total clamps an out-of-range page and fetches the valid page. Responses must echo page/size and contain a bounded, consistent item count. Unknown totals require explicit hasNextPage and display “total unknown” rather than an invented last page. Errors retain query state, hide stale results/totals and expose Retry; loading leaves prior rows inert with a status indicator.

Selection and header Select All are explicitly **current-page only**. Pagination/query changes clear selection; refresh reconciles IDs against fresh visible rows. Bulk actions and selected exports receive only these loaded rows. There is no “select all million matching records” claim or implied backend selection token.

## Column layout preferences

Headers support Community resizing/reordering. The Columns dialog offers visibility, numeric width and keyboard move controls. At least one data column remains visible. Export policy is independent of visibility; hiding a column does not grant or revoke field authorization.

Only `{version,columns:[{id,width,hidden}],pageSize}` is saved. User scope is hashed in the storage key, distinct grid IDs isolate features/datasets, restored IDs are intersected with current authorized schema and invalid storage is ignored. Last asynchronous write wins. Raw user identity, row objects, selection, search text, filter values, tokens and credentials are not stored. Supply a stable, non-sensitive opaque preference scope; hashing is pseudonymization, not an authorization/privacy boundary. Storage denial/quota errors do not break the grid. Server-managed preferences can replace this optional local strategy later.

## Screenshot-derived styling and accessibility

Root/frontend instructions, design analysis/token register and UI-181/UI-246 originals were reviewed at full resolution. UI-181 supplies listing/filter/selected-record cues; UI-246 supplies regular grid surfaces, toolbar and pager placement. The wrapper does not recreate the record-detail page or change the shell.

AG's Theming API maps existing CSS variables: `--iam-grid-header` (`#F1F0FD`), `--iam-grid-row` (`#FBFBFE`), `--iam-border`, `--iam-text`, `--iam-primary`, control fills and spacing. `--iam-grid-selected:#EDE6FD` reuses the measured UI-181 selected-row region already recorded in the token register. Dark selection maps provisionally to primary-soft. Both odd/even rows use the same fill; no unsupported striping was introduced. Status rendering reuses SmartBadge with normalized line-height so badges stay compact inside 40px rows. Header 40px/row 40px, font 14px, radius 6px and viewport dimensions are normalized geometry, not recovered source CSS.

Toolbar actions align right; search/field filters sit above the grid; selection actions appear above rows; the row menu is at the trailing edge; visible range is bottom-left and page size/navigation bottom-right. Export/more icons use the existing Lucide registry. Hover, focus, checkbox interaction, mobile overflow and popup geometry are provisional behavior beyond static screenshot evidence. No generic Tailwind palette replaces source samples and no pixel-perfect claim is made.

Visual review compared UI-181/UI-246 with captured desktop, dark and mobile grids. The compact badges and wrapping toolbar were inspected after correction. Remaining discrepancies: pagination uses Previous/Next and an explicit page count rather than the reference numbered buttons; generic fixture columns differ from business listings; mobile controls wrap and rows scroll horizontally. Dark mappings and new interaction layouts remain provisional until separately approved. Regression snapshots verify this implementation against its captured baseline, not pixel equivalence to the approved reference images.

AG handles grid keyboard navigation/selection and ARIA row/column semantics. Page ranges refer to loaded rows; total counts remain in the external pager. DOM order is enabled and all declared columns remain in DOM for screen-reader consistency; row virtualization remains enabled. At mobile widths, the grid scrolls internally while toolbar/pagination wrap. Row actions use the native Popover API with menu arrow/Home/End/Escape behavior and safe text. Column/export dialogs reuse focus-managed native SmartModal; widths and moves are keyboard accessible. Full manual assistive-technology and cross-browser/native-popover testing remain outstanding.

## CSV/XLSX export policy

`GridExportService.csv(sheet)` returns a Blob; `xlsx(sheets)` dynamically loads ExcelJS and returns a workbook Blob; `download(blob,filename)` uses a temporary object URL and releases it. A sheet has `{name,rows,columns,columnIds}`. Every requested ID must be explicitly `export.allowed=true`; unknown, duplicate or denied IDs fail. No automatic object-property enumeration, hidden-field inclusion, formula objects, hyperlinks or rich-text objects are accepted. Headers are validated as text too.

The export dialog supports current page, selected page rows and filtered client rows, explicit column checkboxes, format and filename. Server grids never fetch every page to emulate a full export. Multiple-sheet callers explicitly pass separate allowlisted sheets; the demo exports five employees and five applications. Worksheet names are normalized and deduplicated. Filenames remove path/control characters and reserved device names.

CSV uses UTF-8/BOM, CRLF record separators, double quotes around every cell, and escaped embedded quotes. Formula-looking strings (including whitespace/control prefixes and normalized full-width variants) receive an in-cell tab/apostrophe text prefix. Finite numeric values remain numeric text, including negatives. This changes dangerous string data intentionally. XLSX assigns literal string cells, numeric cells and Date cells; strings beginning `=` stay strings, never formula objects. Number/date formats are consumer-configurable. Tests parse generated XLSX files to confirm value types and the absence of unapproved fields.

Review basis: [OWASP CSV injection testing guidance](https://wstg.owasp.org/latest/4-Web_Application_Security_Testing/07-Injection/21-CSV_Injection/) and [OWASP's mitigation caveats](https://github.com/OWASP/www-community/blob/master/pages/attacks/CSV_Injection.md?plain=1). There is no universal CSV sanitization guarantee across spreadsheet applications and save/reopen workflows; prefer typed XLSX for spreadsheet exchange and revalidate downstream imports. No real Excel/LibreOffice execution or CSV resave security claim is made from byte-level tests alone.

Browser limits are explicit: 20,000 total rows, 200,000 cells, 10 million text characters, 10 sheets and 32,767 characters per cell. Above these, use a backend export job. Generation is bounded but still CPU/memory work on the browser thread; a worker/streaming client strategy is not implemented. No million-record browser export is claimed.

## Backend export-job contract

`ExportJobProvider` exposes start(request), status(id), cancel(id), download(id). IDs are bounded URL-safe tokens. Job queries apply sorting, filters and search to all authorized matching records; pageNumber/pageSize are carried for DTO reuse and do not limit this full-result job scope. States: queued/running/completed/failed/cancelled/expired; percentage may be null, canCancel controls the action, and expiry is explicit. The generic panel avoids overlapping polls with exhaustMap, stops at terminal states, cancels obsolete subscriptions on destruction, ignores stale commands, supports status retry/cancellation and handles expiry. Terminal progress does not keep animating; completion is 100% only after confirmation.

`ApiExportJobProvider` uses these endpoints under the configured API base:

| Endpoint | Required behavior |
| --- | --- |
| `POST /exports/jobs` | Body `{resource,format,columnIds,query:GridRequest}`; return typed ExportJob; validate read/export permissions and quotas; use an idempotency contract for uncertain retries |
| `GET /exports/jobs/{id}` | User-scoped status, nullable real progress, canCancel and optional expiry; never fabricate percentages |
| `POST /exports/jobs/{id}/cancel` | Confirm cancelled or authoritative current state; cancellation requires backend support |
| `GET /exports/jobs/{id}/download` | Authorized metadata `{url:'/api/exports/jobs/{id}/file',filename,expiresAt}` using the configured base; no arbitrary external URL |
| `GET /exports/jobs/{id}/file` | Stream an authorized attachment with safe Content-Disposition/type, expiry and ownership checks; avoid allocating records in frontend JavaScript |

Job metadata/file endpoints must enforce secure session/authorization, safe field projection and expiration independently of frontend status. Apply equivalent CSV/XLSX injection protections on the backend. Return safe errors/correlation IDs,410 for expired files, no-store/private responses, bounded query/operator schemas, resource-specific limits and CSRF on writes as in the Phase 2 contract. Export jobs must query/stream records on the backend, not ask the browser for millions of rows. No durable queue, signed external download, realtime transport or deployed backend is invented here.

The mock provider simulates three acknowledged work units, cancellation, unknown progress, failure and expiry. Downloads contain at most ten matching development fixture records, clearly labeled as samples. It honors the resource/query and explicit job column list. This validates the frontend lifecycle only. Large-scale export is **not complete until the backend and authorization/expiry/idempotency policies are integrated**.

## Mock server and security boundaries

The development-only interceptor handles `/api/dev/grid/{dataset}/search` through HttpClient and the normal auth/CSRF/correlation chain; production imports no such interceptor. Requests use a typed POST read-query body, so no mutation retry policy was changed. The source is cancelled through Observable unsubscription; tests also verify actual HttpTestingController cancellation for the production adapter. Mock HTTP counters are not network/backend throughput measurements.

A real listing API must validate allowed resource, readable/searchable/sortable fields, field value types, operator support, page bounds, maximum result count, permissions and total-count semantics. Apply authorization before counting/slicing; do not concatenate descriptors into SQL. The consumer-supplied decoder validates unknown rows and should strip disallowed fields. Frontend menus/exports do not provide backend authorization. Export/download actions should use current permissions and server auditing; no real employee data or credentials are included in fixtures.

## Verification and measured limits

Executed verification on Windows/Chrome Headless 157:

- `npm.cmd run build`: passed production compilation and configured budgets. Initial JavaScript/CSS: 396.98 kB raw, 109.09 kB estimated transfer. Development grid examples and their AG Grid/ExcelJS code are excluded from this production shell; this is not the bundle size of a production feature consuming the grid.
- `npm.cmd run typecheck`: passed application and spec strict TypeScript checks.
- `npm.cmd run verify:production-auth`: passed scan of 22 production JavaScript assets for development auth/config/showcase markers.
- `npm.cmd run test:unit`: 92 passed, including source cancellation/query validation, stale responses, page clamping, scoped preferences, CSV injection guards, parsed XLSX values and export-job lifecycle.
- `npm.cmd run test:e2e -- --workers=2`: all 65 passed (9.9 minutes), including all 12 grid cases, existing authentication/component/feedback/shell regressions, actual CSV/XLSX downloads, all export scopes, server number/date/status filters, selection, preferences, jobs, keyboard navigation, light/dark accessibility and visual snapshots. This final run compared existing baselines without updating them. Three new grid baselines were previously captured and visually reviewed at desktop, dark and mobile sizes.

The initial full browser run had 64 passes and one pre-existing authentication test timing failure: it opened the profile disclosure before dashboard navigation completed. The test now waits for the destination heading before interacting with the disclosure. No arbitrary sleep or application behavior change was introduced.

Performance coverage uses 10,000 generated records per dataset and verifies fewer than 60 rendered rows for a requested 100-row page. This establishes bounded DOM rendering, not backend throughput or a production latency target. Timing includes development navigation, mock sign-in and rendering; it is not an isolated grid benchmark. Coverage also includes unknown totals, retries, mobile reflow and automated accessibility. Existing Phase 1–4 suites remain regression checks.

Remaining work: real listing/export APIs and field authorization; backend scalable job implementation and downloads; upstream dependency advisories; manual screen-reader/browser testing; dedicated interaction references. The app still has no lint script, so strict TypeScript/template checks and executed tests are used. Browser download initiation is not proof that a user saved a file successfully. No Phase 6 implementation was started.
