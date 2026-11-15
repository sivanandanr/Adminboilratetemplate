# SmartIAM administration frontend

Angular 20 standalone, zoneless enterprise frontend with a screenshot-derived design system, authentication/session integration, reusable controls, feedback, AG Grid Community, dashboard widgets and administration page templates.

From `frontend`, run `npm.cmd ci`, then `npm.cmd start`. Development uses the clearly labeled, memory-only fixtures documented in [authentication setup](frontend/docs/PHASE_2_AUTH.md). Production uses same-origin API adapters and requires the backend contracts; it does not provide a deployed IAM backend.

Start at `/administration`, `/dashboard`, `/identity` or `/dev/components`. The developer catalog is permission guarded and excluded from production. No commercial AG Grid features are used.

- [Architecture](frontend/docs/ARCHITECTURE.md)
- [Component catalog](frontend/docs/COMPONENT_CATALOG.md)
- [Dashboard configuration](frontend/docs/DASHBOARD_GUIDE.md)
- [Administration templates](frontend/docs/ADMINISTRATION_TEMPLATES.md)
- [Authentication integration](frontend/docs/BACKEND_AUTH_CONTRACT.md)
- [Grid integration and safe exports](frontend/docs/PHASE_5_GRID.md)
- [Administration backend contracts](frontend/docs/BACKEND_ADMINISTRATION_CONTRACT.md)
- [Design system and references](frontend/docs/design/DESIGN_ANALYSIS.md)
- [Screenshot comparisons](frontend/docs/design/PHASE_6_COMPARISON.md)
- [Quality results](frontend/docs/PHASE_6_COMPLETION.md)
- [Remaining issues](frontend/docs/KNOWN_LIMITATIONS.md)

Validation commands are in `frontend/package.json`: `build`, `typecheck`, `test:unit`, `test:e2e`, `verify:production-auth`. There is no configured lint script. Keep production backend authorization, CSRF protection and secure HttpOnly sessions authoritative.
