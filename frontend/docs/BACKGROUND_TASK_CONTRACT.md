# Background task integration contract

The frontend task service is root-scoped and backend-agnostic. A live server task list is not implemented in this frontend repository. The shipped `ApiTaskProvider` has `TASK_API_CONFIG.endpoint = null`, so initial sign-in does not issue requests to a made-up endpoint.

Enable a real server contract in application composition:

```ts
{ provide: TASK_API_CONFIG, useValue: { endpoint: '/api/tasks', pollingMs: 1000 } }
```

The endpoint is an example, not an existing backend. Configure it under `AUTH_CONFIG.apiBase`, or replace `BACKGROUND_TASK_PROVIDER` with an adapter for the actual API. HttpOnly cookie sessions, XSRF and backend authorization remain authoritative. The server must scope all list/status/cancel/retry/download operations to the current principal; frontend owner clearing is a privacy measure, not authorization.

| Operation | Required behavior |
|---|---|
| GET configured endpoint | Return an owner-scoped array of at most 50 TaskSnapshot records for refresh restoration. |
| GET endpoint/:id | Return the latest snapshot; default polling is 1s and never overlaps a pending request. Terminal state stops polling. |
| POST endpoint/:id/cancel | Acknowledge cancellation or return the actual terminal/running state if cancellation lost a race. Never claim cancelled before acknowledgement. |
| POST endpoint/:id/retry | Retry an eligible failed task through the same stable task resource ID and return its snapshot. Backend enforces permission/idempotency. Successful retry resumes polling. |
| GET endpoint/:id/download | Return `{ filename, url, expiresAt }` with an authenticated, same-origin API path and an expiry in Unix milliseconds. Do not return external signed URLs through this adapter. |

TaskSnapshot fields:

```ts
{
  id: string;                   // 1–200 ASCII letters/digits/_/-
  title: string;                // 1–160 display-safe characters
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  percentage?: number | null;   // actual confirmed 0–100, null when unknown
  completed?: number | null;
  total?: number | null;
  unit?: string;               // <= 40 characters
  etaSeconds?: number | null;   // server estimate, never fabricated by the UI
  message?: string;            // <= 600 display-safe characters; never exception/stack content
  canCancel?: boolean;
  canDownload?: boolean;
  canRetry?: boolean;
}
```

Counts and ETA must be finite and nonnegative; completed must not exceed a known total. Include capability flags explicitly; they reflect server policy, which must also be enforced on commands. Task results must not contain credentials or privileged record data merely to render progress. General backend errors continue through safe ApiError presentation.

The server runs the actual jobs independently of the browser, routing and session lifetime. Polling must not renew idle activity, and cancelling an HTTP monitor must not cancel its server job. The frontend detaches monitors on logout/account change without invoking cancellation. A newly authenticated client reloads the authorized server list. No tasks, credentials or progress payloads are persisted to localStorage/sessionStorage.

The existing `ExportJobProvider` contract is preserved through an adapter. It already supplies start/status/cancel/download and can produce real server-backed progress when connected. Its existing API lacks a list endpoint, so it cannot by itself rehydrate export jobs after a browser refresh. Supply a unified task-list adapter/server contract for that requirement. A declined cancellation performs no backend call; a monitoring failure offers a status recheck rather than blindly starting another mutation. Downloads retain explicit export policy and formula-injection sanitization in the existing export implementation; a real server export must enforce the same policy.

Tests use isolated provider/HTTP fixtures and development mock export jobs. No fake backend endpoint, synthetic production percentage, worker library or new major dependency is introduced.
