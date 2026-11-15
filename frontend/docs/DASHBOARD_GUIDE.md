# Dashboard configuration

Open `/dashboard`. The existing `/administration` UI-246 dashboard remains available. Employee, Manager, IAM Administrator and System Administrator are configurable presentation profiles, not an authorization mechanism or impersonation feature. The active user's permissions constrain available profiles and visible widgets.

`dashboardRoles` in `shared/dashboard/dashboard.models.ts` maps Employee to `dashboard.view`, Manager/IAM to `dashboard.view` + `admin.view`, and System Administrator to `dashboard.view` + `admin.configure`. These reuse the current coarse application permissions. A backend integration should introduce finer domain/role permissions as necessary; choosing a profile never grants privileges.

## Typed registry

`widgetRegistry` lists KPI, status, chart, activity, pending tasks, quick actions, risk and notification summaries. `DashboardWidget` defines `id`, `kind`, `title`, required `permissions`, optional `metric`/`trend` and typed `items`. The existing `KpiCard` remains the authoritative KPI renderer; trend content is composed inside it. Chart containers provide simple CSS bars and a real data table for accessible values, without introducing a chart dependency. Interactive time-series/donut charts are not implemented.

```ts
const widget: DashboardWidget = {
  id: 'pending-work', kind: 'tasks', title: 'Pending work',
  permissions: ['dashboard.view'],
  items: [{ id: 'request', label: 'Review requests', detail: '8 pending', path: '/requests' }],
};
// <smart-dashboard-widget [widget]="widget" [state]="state" (retried)="refresh()" />
```

Widget `state` accepts ready/loading/empty/error. Error retry emits an event, so the feature owns transport. Kinds share the container and list APIs; they are not separate duplicate widgets. The catalog provides a state explorer. Dashboard-wide loading, error, retry, empty and refresh timestamp are provided by `RoleDashboard`.

`DASHBOARD_PROVIDER.load(role): Observable<DashboardData>` supplies `mock`, ISO `refreshedAt` and widgets. Production calls `GET /api/dashboards/{role}` and validates/project-bounds unknown data. Unknown widget kinds/permissions, duplicate widget IDs, invalid dates, unsafe paths and invalid chart values are rejected. KPI icons from API data are normalized to the approved local icon set. No remote HTML or arbitrary component class is instantiated.

Development values are explicitly labeled synthetic/mock. Employee covers requests, approvals, access and notifications; Manager covers team members/requests/approvals/reviews; IAM covers identities, applications, accounts, provisioning, failures, orphans, exceptions and reviews; System covers health, integrations, scheduler, errors and alerts. Their supporting widgets link to implemented workspaces where available. These counts are independent fixtures, not mathematically reconciled production analytics or live health. Notification summary fixtures are separate from the header notification provider.

Data refresh is user initiated. Switching roles or refreshing cancels the previous subscription. The API must authorize the requested profile and filter individual widgets/links/data before returning them. Client permission filtering provides UX, not protection against unauthorized API access.
