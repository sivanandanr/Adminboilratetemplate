# Administration and dashboard API contracts

These endpoints are frontend integration contracts, not implemented backend services. Production uses the configured application-relative API base (`AUTH_CONFIG.apiBase`, default `/api`) and the existing credentialed auth/CSRF/error/correlation interceptor chain. No token or secret belongs in a feature component.

## Dashboard

`GET /api/dashboards/{role}`, where role is employee/manager/iam/system, returns:

```json
{
  "refreshedAt": "2026-11-10T09:00:00Z",
  "widgets": [{
    "id": "requests", "kind": "kpi", "title": "My requests",
    "permissions": ["dashboard.view"], "items": [],
    "metric": {"label":"My requests","value":"12","detail":"Last 7 days","tone":"primary"},
    "trend": {"direction":"up","label":"2 more than previous period"}
  }]
}
```

Kinds: kpi/status/chart/activity/tasks/actions/risk/notifications. Items have id/label/detail and optional local path/finite nonnegative numeric value. KPI tone is primary/success/warning/danger/info. Trend direction is up/down/flat. The adapter normalizes API KPI icons to a trusted local icon. API mock flags are ignored; production snapshots are never labeled synthetic based on untrusted metadata. Maximum 40 widgets and 30 items per widget, bounded strings, unique widget IDs and valid ISO timestamps are required.

Authorize the profile independently of role selection and omit unauthorized widget values, actions and counts. Personal requests/access/notifications require ownership filtering; manager data requires validated team scope. Never return another user's data and rely on client hiding. Return freshness timestamps from the actual data source. An empty widgets array is a valid empty state. Failure produces a safe retry state; no fake health/count fallback is used by `/dashboard`.

## Paginated record API

Allowed resources: employees, applications, accounts, entitlements, requests, approvals, workflows, policies, audit and personal `access`. The sample UI uses a deliberately small normalized projection:

```ts
interface AdminRecord {
  id: string; name: string; owner: string; category: string;
  status: 'Active' | 'Inactive' | 'Pending' | 'Approved' | 'Rejected';
  description: string; updatedAt: string;
}
```

| Endpoint | Frontend behavior / server requirements |
| --- | --- |
| `POST /administration/{resource}/search` | Typed Phase 5 GridRequest body; response GridPage<AdminRecord>. Apply authorized search/filter/sort before pagination. Unknown totals require hasNextPage. Maximum page size 100; no read-query side effects. |
| `GET /administration/{resource}/{id}` | Authorized, field-projected detail response; unknown IDs must not leak resource existence across scopes. |
| `POST /administration/{resource}` | Validated create; return confirmed AdminRecord. No automatic mutation retry. |
| `PUT /administration/{resource}/{id}` | Validated update; return confirmed AdminRecord. Reject forbidden fields and stale/conflicting writes according to backend concurrency policy. |
| `POST /administration/approvals/{id}/decision` | Body `{decision:'Approved'|'Rejected',reason:string}`; verify assignment/delegation/permissions and Pending state transactionally, audit the reason, then return the confirmed row. |

Paths above are relative to the configured base. IDs are bounded URL-safe application identifiers; the frontend rejects path separators/escape traversal. `RecordPatch` contains name, owner, category, description and status; it never supplies id, timestamp, permissions or arbitrary object fields. Unknown response fields are projected away. The real API should replace display owner strings with authorized identifiers through an adapter when integrating actual domain schemas.

`recordCapabilities` declares allowed sorting fields and filter/operator combinations; the server must independently validate value types, limits and field authorization. Bind parameters safely; never concatenate filter descriptors into SQL. Names/owners are required and bounded, descriptions bounded, status transitions resource-specific. Audit records are immutable, approval decisions use the dedicated endpoint, and personal requests/access/approvals must always be scoped to the authenticated subject. UI visibility is not an authorization boundary.

Protect state-changing requests with the existing secure HttpOnly/SameSite session and anti-CSRF contract. Use no-store/private responses as appropriate. Sanitize server errors, retain correlation IDs, and return 401/403/validation/conflict responses without sensitive internal details. Mutations are not automatically retried. Concurrency versions/ETags, idempotency keys, durable draft storage, assignment/delegation and production change history are required integration decisions; the compact example model does not implement them.

For notification APIs and scalable exports, reuse [Phase 4](PHASE_4_FEEDBACK.md) and [Phase 5](PHASE_5_GRID.md). Safe exported fields and formula defenses must also be enforced by backend export jobs. A completed download metadata response is not evidence of authorized backend streaming until those endpoints are implemented.
