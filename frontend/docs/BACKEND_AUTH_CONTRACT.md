# SmartIAM BFF authentication contract

Frontend implementation: [PHASE_2_AUTH.md](PHASE_2_AUTH.md). All endpoints below are **required future backend work**; the Angular application does not create real sessions, validate production passwords or execute OIDC/Active Directory authentication.

## Central configuration

`core/auth/auth.config.ts` defines the relative base `/api` and every endpoint suffix. `BffAuthProvider` composes validated same-origin paths from that configuration. Use an ASP.NET/YARP same-origin gateway or development proxy rather than sending browser credentials to an arbitrary cross-origin API. The production provider configuration is in `environments/environment.ts`; development uses its file replacement.

| Method | Default endpoint | Request | Required behavior |
| --- | --- | --- | --- |
| GET | `/api/auth/session` | Cookie session | Return `AuthSession` for an authenticated caller; `401` or JSON `null` for anonymous. Issue/refresh the separate CSRF request-token cookie even for the anonymous login page. Do not renew the authentication session merely because it was read. |
| POST | `/api/auth/login` | `{ username, password }` plus CSRF token | Validate local credentials on the server, apply rate limiting/lockout policy, rotate the session identifier and return `AuthSession`. Generic `401` on credential failure; do not reveal whether an account exists. |
| GET navigation | `/api/auth/challenge/entra?returnUrl=...` | Safe application-local return path | Initiate backend-managed Microsoft Entra OIDC with server-owned state/nonce/correlation and a fixed registered callback. Do not return access/refresh tokens to Angular. |
| GET navigation | `/api/auth/challenge/ad?returnUrl=...` | Safe application-local return path | Execute the chosen backend-managed AD/Windows/Negotiate flow and create the same session contract. The browser performs no LDAP or AD password comparison. |
| Backend-specific | `/api/auth/callback/entra` and any required AD callback | Identity-provider response | Validate issuer, audience, signature, nonce/state and correlation; bind/rotate a server session, then redirect only to a validated local return path. This is not an Angular callback route. |
| POST | `/api/auth/renew` | `{}` plus CSRF/session | Confirm the caller is still eligible, enforce idle/absolute lifetime and revocation, optionally rotate cookies and return a newly confirmed `AuthSession`. Never extend beyond the backend's absolute maximum lifetime. |
| POST | `/api/auth/logout` | `{}` plus CSRF/session | Revoke the current server session and expire its cookie; return `204`/empty success. Make repeated/already-expired logout safe; the adapter treats `401` as already terminated. |
| PATCH | `/api/profile` | A subset of `{ displayName, email, department, designation }` plus CSRF/session | Enforce `profile.edit` and the allowed-field policy on the server; validate input; return the full updated `AuthSession` snapshot. Reject extra/privileged fields. Saving a profile must not implicitly renew the session. |

The same-origin gateway must route `/api` to the BFF, not the SPA fallback. Identity-provider redirect/callback failure pages must return users to a safe application error state without exposing tokens, provider secrets or raw protocol responses. External Entra/AD flows are intentionally unavailable in development mock mode.

## Wire DTO

The Angular adapter receives `unknown` and validates the session contract before accepting it. All object keys below are required. Strings may be empty when a field is unavailable; `lastSignIn` alone may be null. All dates are finite **UTC epoch milliseconds**, not seconds or unparsed strings. The backend should populate `serverTime` immediately before sending the response.

```json
{
  "serverTime": 1794708000000,
  "expiresAt": 1794708900000,
  "user": {
    "id": "opaque-user-reference",
    "displayName": "Example User",
    "username": "example@company.test",
    "employeeId": "EMP001",
    "email": "example@company.test",
    "department": "IT",
    "designation": "Administrator",
    "manager": "Example Manager",
    "accountType": "Employee",
    "provider": "local",
    "roles": ["Administrator"],
    "permissions": ["dashboard.view", "admin.view", "admin.configure", "profile.view", "profile.edit"],
    "editableFields": ["displayName", "email", "department", "designation"],
    "lastSignIn": 1794708000000
  }
}
```

`provider` is `local`, `entra` or `ad` for the BFF. `mock` is reserved for the isolated development adapter. `expiresAt` must exceed `serverTime` and represent the currently authorized boundary (including any earlier idle/absolute/revocation limit). Cookie expiry and server session state must agree with it. The frontend counts response transit conservatively and never treats its timer as an authorization mechanism.

Known application permissions are `dashboard.view`, `admin.view`, `admin.configure`, `profile.view`, `profile.edit` and the development-only `showcase.view`. Unknown server permission strings are filtered from the frontend model; adding new features requires explicitly extending the typed model/route policy. Roles are display labels, not implicit permission grants. Do not send raw bearer tokens, cookies, authentication tickets, directory group dumps or internal authorization records in this DTO. `editableFields` is a UI hint; it never replaces server-side field authorization.

## Session, cookie and CSRF requirements

- Enforce authentication and authorization for every protected endpoint. Browser guards, cached permissions, hidden buttons and tab messages are not security controls.
- Use HTTPS and a server-managed Secure, HttpOnly session cookie. Configure Path/Domain/SameSite consistently with the chosen OIDC flow; prefer host-only cookies and narrow cookie scope. The frontend never reads, stores or sends a bearer token in a custom authorization header.
- Implement CSRF validation on login, logout, renew, profile changes and every unsafe authenticated operation. The Angular configuration reads a separate `XSRF-TOKEN` cookie and sends `X-XSRF-TOKEN` on same-origin unsafe requests. This anti-CSRF request token must be JavaScript-readable; it is **not** the HttpOnly authentication cookie. Validate it against server/session state and validate Origin/Referer as appropriate. SameSite alone is not a replacement for CSRF validation. See the [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) and [Angular HTTP configuration](https://angular.dev/guide/http/setup).
- Return `Cache-Control: no-store` for authentication/session/profile/error responses. Avoid service-worker/browser/shared-proxy caching of private data. GET session and profile reads must not keep a user alive by polling.
- Enforce server idle timeout, absolute maximum lifetime, renewal policy, revocation and credential-change invalidation. Do not permit a late/racing renewal or profile request to recreate a logged-out session. Logout must terminate the session identified by that request, not an unrelated new sign-in.
- Handle server time changes and expiry consistently. A resumed browser revalidates; a network failure blocks local access, and a renewal failure never grants a new deadline.
- Validate the return path again on the backend after canonicalization; reject external/protocol-relative URLs, backslashes, control characters, encoded equivalents and login loops. Never trust the frontend's `safeReturnUrl` alone.

## Error and correlation policy

Use `401` for missing/expired/invalid authentication, `403` for insufficient access, `400`/`422` for invalid fields, and appropriate transient `502`/`503`/`504` or network failures. Return generic authentication failures, not account enumeration details or stack traces. The frontend normalizes errors into `ApiError { status, kind, message, correlationId? }` and does not display raw server bodies.

Accept/validate a bounded `X-Correlation-ID`, create a server correlation ID when absent/invalid and propagate it through gateway/API logs and safe error metadata. Never log passwords, cookies, CSRF request tokens or authorization payloads. The frontend preserves one correlation identifier across its single automatic GET/HEAD retry. It never retries login, logout, renew, PATCH or other mutations automatically; retry buttons represent explicit user actions.

## Outstanding integration validation

Before enabling production use, verify real cookie attributes, CSRF rejection/rotation, session fixation prevention, OIDC state/nonce/replay/issuer checks, AD policy, redirect validation, rate limits, authorization/field validation, all status codes, renewal/logout races, non-cacheable private responses, multi-tab revocation and clock/expiry behavior against the actual BFF. Current unit/browser tests validate frontend behavior and the adapter contract, not a deployed identity system.
