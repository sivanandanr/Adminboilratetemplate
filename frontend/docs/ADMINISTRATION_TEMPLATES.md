# Administration templates and working samples

`shared/templates/admin-page.ts` exports `AdminPageTemplate` with typed `PageTemplateKind`. Required inputs are `title` and `kind`; optional inputs are `description`, `icon`, `mock`, `state`. `retried` delegates reload to the feature. Project page-level controls with `[template-actions]`; normal content composes the existing controls. Shell route metadata supplies breadcrumbs and active navigation.

```html
<smart-admin-page title="Employees" kind="listing" description="Manage employee records."
  [mock]="provider.mock" [state]="state" (retried)="reload()">
  <a template-actions class="button button-primary" routerLink="/identity/new">Create employee</a>
  <smart-data-grid ... />
</smart-admin-page>
```

## Template coverage

| Kind | Working example | Composition |
| --- | --- | --- |
| listing | `/identity`, `/applications`, `/accounts`, `/entitlements`, `/requests`, `/approvals` | Query summaries + paginated grid, filters, safe exports, row actions |
| create | `/identity/new`, `/applications/new` | Typed shared form controls, validation, save/cancel and acknowledged navigation |
| edit | `/identity/EMP0001/edit`, `/applications/APP0001/edit` | Provider-loaded form, validation, dirty guard and confirmed save |
| details | `/accounts/ACC0001`, `/entitlements/ENT0001`, `/requests/REQ0001` | Read-only definition list, status and history/related tabs |
| master-detail | `/identity/EMP0001` | Selectable ten-record master list + selected employee details; local route/history navigation and stacked mobile panels |
| tabbed-details | `/applications/APP0001` | Keyboard-navigable Details/Related records/History tabs |
| configuration | `/workflows`, `/provisioning/policies`, `/administration/system` | Provider-backed configuration form and bottom-right Save |
| wizard | `/requests/new` | Existing SmartWizard, validation, in-memory draft, review, provider-confirmed submission |
| approval | `/approvals/APP0001` | Request details + reason-required confirmation + decision state |
| audit | `/reporting/logs` | Read-only paginated audit grid, search/filter, export and details |

All kinds use common title/description/actions and ready/loading/empty/error/retry states. Development pages expose an explicitly labeled preview selector to exercise states; production omits that selector. State previews demonstrate presentation and do not simulate a server outage. The grid independently owns its real request states. Lists support empty results through search as well.

## Permissions and behavior

Administrative listings/details require `admin.view`; create/edit and configuration require `admin.configure`. Personal requests, access and read-only approval tasks use `dashboard.view`; recording an approval decision additionally requires `admin.view`. The current permission vocabulary is intentionally coarse. Real approval assignment, personal ownership, delegation, field authorization and separation of duties must be enforced by the backend.

Create actions and edit links are hidden when unavailable; disabled decision/save controls also communicate unavailable operations. Methods recheck permissions before mutations. Shared dialogs require a reason for decisions. Backend mutation results drive success feedback; failures remain on the form/dialog and permit review/retry. Form buttons block duplicate saves. Dirty form navigation invokes the existing unsaved-changes confirmation; saving/discarding clears the dirty state.

The column schema is a feature-owned projection/export allowlist. Listing KPIs explicitly distinguish matching query total from Active/Pending/Rows on the **loaded page**; no global counts are inferred from one page. Sorting/filtering happens before pagination through the provider. The mock stores 100 records per resource and preserves saves/decisions across client-side navigation; Phase 5's five 10,000-row demos remain the larger rendering tests.

These are functional boilerplate examples with a compact shared record schema. The master list deliberately loads ten records and links to the full paginated listing for others; it is not the complete employee investigation screen. History/related tabs do not invent backend relationships. Configuration Cancel restores the last provider-confirmed snapshot, including after a successful save. Workflow/provisioning configuration demonstrates validated persistence of basic metadata; it is not a graph designer, provisioning engine, policy evaluator or production approval system. Destructive account operations, connector execution and import are intentionally absent rather than falsely simulated.
