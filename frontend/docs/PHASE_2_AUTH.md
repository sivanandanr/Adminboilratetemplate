# Phase 2 — Authentication and session management

## Run the development application

From `frontend`, run `npm.cmd start` and open `/login`. The Angular development configuration selects the isolated mock adapter. Public, disposable **development-only** examples:

| Username | Password | Access |
| --- | --- | --- |
| `admin@example.test` | `Demo-only!23` | Dashboard, administration, profile editing and authentication showcase |
| `reader@example.test` | `Demo-only!23` | Dashboard and read-only own profile; administrative routes/actions denied |

These are fixture values, not real credentials or a production security mechanism. Mock sessions, edited profile data and permission changes exist only in memory: reloading a tab requires another sign-in. “Remember username” stores only the explicitly opted-in username under `smartiam.rememberedUsername`; it does not remember a password or authenticate a user. It is enabled in development and disabled in the production default configuration.

Production builds select `BffAuthProvider`, never `MockAuthProvider`. `environment.ts` is the production entry; Angular's development-only file replacement selects `environment.development.ts`. No query parameter or browser storage key can enable production mock authentication. `npm.cmd run verify:production-auth` scans emitted JavaScript for development credentials, the dev timeout hook and showcase implementation markers. Production will require the endpoints in [BACKEND_AUTH_CONTRACT.md](BACKEND_AUTH_CONTRACT.md); without a reachable BFF it displays a service-unavailable login state rather than granting access.

## Implemented frontend

- Login: typed reactive controls, required/length validation, show/hide password, optional username preference, busy state, explicit invalid-credentials/network feedback, expired/signed-out messages, configured provider selection and Entra ID entry point. Local authentication posts credentials to the BFF; Entra and AD initiate a same-origin backend challenge. Entra is disabled in mock mode because no real identity-provider flow is connected.
- Logout: header profile menu, confirmation, immediate local invalidation/cache clearing, cross-tab notification, BFF session termination, already-expired handling and explicit server-logout-failure warning/retry. Duplicate in-flight logout operations are merged. A failed server logout is never reported as confirmed termination: an HttpOnly server cookie cannot be removed by JavaScript.
- My Profile: initials, display name, username, employee identifier, email, department, designation, manager, account type, provider, assigned roles, known effective application permissions and optional last sign-in. The BFF-provided editable-field list and `profile.edit` permission control editing. Save validates and trims permitted fields; Cancel resets to the last confirmed snapshot. Background permission refresh preserves an allowed unsaved draft; revoked edit access resets/disables fields. No raw tokens, claims or internal authorization database identifiers are displayed.
- Permissions: Signal-based effective permissions, typed route metadata, auth/permission guards, icon-menu filtering, protected actions, an access-denied page, refresh from the header, a resolving indicator and revocation of currently displayed routes. The server remains authoritative; menu hiding and frontend guards are UX conveniences, not security boundaries.
- Session: configurable idle deadline and warning window, wall-clock/server-expiry comparison, accessible native warning/expired dialogs, explicit Continue Session, Logout Now, automatic redirect, tab activity/logout coordination and revalidation on focus/visibility return. Background HTTP completion does not count as user activity.
- HTTP: relative central BFF base/endpoints, credentialed API requests, Angular XSRF cookie/header integration, correlation IDs, typed generic API errors, 401 expiry and 403 denial handling, a 10-second request timeout, and at most one retry for transient GET/HEAD failures. Mutations and login/logout/renewal are not automatically retried. External-origin requests receive no BFF credentials/correlation header from this interceptor.
- Development showcase: `/auth-showcase`, protected by `showcase.view`. It embeds the real login component in a non-submitting preview mode (normal/required/loading/invalid/expired), links to the working profile layout, demonstrates permission-aware buttons and dynamic revocation, and previews idle/expired/logout dialogs. Preview controls never grant authentication or send login credentials. Production does not register/load this route.

The public login route and authenticated shell are separate. Safe internal return URLs are preserved through guards; external/protocol-relative/backslash/control-character return URLs and login loops fall back to `/administration`. No Phase 3 component-library work was started. The existing Phase 1 header/sidebar/page compositions and central palette are retained.

## Architecture and contracts

| File / abstraction | Responsibility |
| --- | --- |
| `core/auth/auth.models.ts` | `AuthProvider`, DTOs, known permissions, injection tokens, path policy and safe-return validation |
| `auth.facade.ts` | Central auth/session/user Signals, permission computations, initialization, provider operations, epoch fencing, local invalidation and logout coordination |
| `mock-auth.provider.ts` | Development-only asynchronous fixtures; invalidation cancels the effect of obsolete mock requests and clears the private fixture session |
| `bff-auth.provider.ts` | Typed HTTP adapter and local versus backend-challenge login strategy; validates unknown session responses |
| `auth.guards.ts` | Functional `AuthGuard`, `PermissionGuard`, `LoginGuard` |
| `auth.interceptor.ts` | Functional `AuthInterceptor`: scoped API credentials, correlation, retry/error policy and 401/403 behavior |
| `session.service.ts` | Idle/server deadlines, renewal confirmation, resume checks, meaningful-activity detection and cross-tab coordination |
| `session-channel.ts` | BroadcastChannel transport; transient storage-event fallback containing event type/timestamp only |
| `can.directive.ts` | Typed structural permission-aware control rendering |
| `auth-dialogs.ts` | Authentication-scoped native dialogs and development preview state |
| `features/auth/` | Lazy login, profile, access denied and development showcase pages |
| `environments/` | Build-time provider selection and central auth/API settings |

The adapter boundary isolates real HTTP from fixtures. Provider-specific login initiation is a strategy inside the BFF adapter; the facade centralizes state/operations. Guards and interceptor are Angular functional APIs. Native `<dialog>` is used only for the required Phase 2 session/logout flows; this does not introduce a general Phase 4 dialog framework. Existing `Button`, `PageHeader`, `Icon` and feedback primitives are reused. No additional major dependencies were installed.

## Session policy details

Production frontend hints default to 15 minutes idle and 60 seconds warning; the server may impose an earlier expiry and must enforce its own idle/absolute lifetime. Development defaults are 5 minutes idle, 30 seconds warning and a 15-minute mock server window. These values are in the central auth configuration, not scattered through controls. A development-only pre-bootstrap `__SMARTIAM_MOCK_CONFIG__` hook permits deterministic short-timeout tests; it is absent from production output.

The effective deadline is the earlier of the meaningful-activity idle deadline and the latest confirmed server expiry. Absolute server timestamps are adjusted conservatively for server clock difference using the request start: the full round trip is counted against the remaining lifetime, so network latency does not add time. The timer recomputes deadlines from current time; it does not assume background interval callbacks ran on schedule.

Pointer-down, non-modifier key-down, touch-start and wheel input count as activity. Polling, promise completion and route data loads do not. Activity cannot dismiss/reset a warning already shown. Continue Session is a POST renewal; the warning/deadline changes only after a successful, non-stale response. Failed renewal retains the warning and original cap. A late response after logout/expiry cannot restore session state.

Tabs send only `{ type: 'activity' | 'logout' | 'renewed', at: epochMilliseconds }`. They do not exchange credentials, user profiles, permissions, session IDs or bearer tokens. Relevant activity is throttled relative to the configured warning window. Logout clears the other tab's auth and mock cache. Renewal/login notifications cause other authenticated tabs to revalidate with their provider before accepting a refreshed deadline. Native BroadcastChannel is preferred; the storage fallback briefly writes/removes event metadata only. Cross-tab notifications are coordination hints, not authorization evidence.

Returning to a visible/focused tab first checks elapsed expiry, then revalidates an unexpired session (throttled/deduplicated). Failed revalidation blocks local access and offers reconnection. Server GET session/profile responses must be non-renewing and non-cacheable. The backend remains responsible for absolute expiry, cookie invalidation, authorization and revocation even if browser clocks or events are manipulated. This follows the server-enforcement and cookie guidance in the [OWASP session-management cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Visual references and discrepancies

Root/frontend AGENTS, Phase 1A analysis/manifest/token documentation and the Phase 1 shell were reviewed. UI-181's identity/details presentation supports the profile field hierarchy; UI-246 remains the shell anchor. No dedicated approved login, self-service My Profile or session-warning design was identified in the 253-image manifest. These new layouts are explicitly provisional compositions using the existing navy sidebar, lavender canvas, pale header/card surfaces, purple actions, borders, type scale and spacing tokens. No new generic Tailwind palette was substituted and no pixel-perfect fidelity is claimed.

The login page uses a navy brand panel and a compact near-white sign-in card. Profile uses identity and detail panels within the unchanged shell. Session/logout modals use the existing border/radius/backdrop tokens and native focus behavior. The header now shows the authenticated display name/provider and actual initials, rather than the Phase 1 mock-profile placeholder. Permission-dependent controls disappear for the reader account by design. These are functional Phase 2 changes, not independent shell redesigns.

Reviewed snapshots are under `e2e/auth.spec.ts-snapshots/` (login, profile, idle warning) and the existing shell snapshot directory. Profile visual tests use a fixed public fixture sign-in time to avoid timestamp instability. Dark/mobile auth layouts derive from the same token infrastructure; they still need dedicated design references and manual assistive-technology review.

## Verification and remaining integration

Final verification on 15 November 2026: production build and strict app/spec type checks passed; all 30 unit/component tests and all 32 Playwright tests passed. The ordinary Playwright run compared the saved visual baselines without updating them and included automated accessibility and responsive checks. Production isolation verified all 20 emitted JavaScript assets. Initial production output is 321.87 kB raw / 92.78 kB estimated transfer. `git diff --check` reported no whitespace errors. A visible session-checking state renders during startup while route guards wait for session restoration.

Executed commands are `npm.cmd run build`, `npm.cmd run typecheck`, `npm.cmd run test:unit`, `npm.cmd run test:visual:update`, `npm.cmd run test:e2e` and `npm.cmd run verify:production-auth`. Unit tests cover mock success/failure, guards/return URLs, stale responses, logout failure/expiry, profile validation, permission refresh, CSRF/correlation, scoped credentials, HTTP errors/retries, idle/renewal/absolute expiry and suspended-tab behavior. Browser tests exercise actual login/logout/profile, restricted accounts, dynamic revocation, renewal/expiry, two-tab coordination, accessibility/reflow and the retained shell. Final command outcomes are recorded in the task result; snapshot updates alone are not proof of source fidelity.

Real local credential validation, Entra OIDC/AD challenges/callbacks, secure session cookies, CSRF issuance/enforcement, persistence, server expiry/renewal, profile storage, permission resolution and audit/rate-limit policies require the future BFF. They are not fabricated in the browser. The endpoint checklist and wire DTO are in the backend contract. Full manual screen-reader/contrast review and missing design approvals remain outstanding. The starter still has no configured lint command. Previously documented dependency advisories/deprecated Lucide packaging are unchanged; no broad dependency remediation was included in Phase 2.
