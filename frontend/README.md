# Integrated SmartIAM administration frontend

Start with `/administration` for the existing screenshot-based administration view, `/dashboard` for role profiles, `/identity` for employee records, `/applications`, `/accounts`, `/entitlements`, `/requests`, `/approvals`, `/workflows`, `/provisioning/policies` and `/reporting/logs` for connected mock examples. `/dev/components` is the protected integrated catalog.

See [architecture](docs/ARCHITECTURE.md), [dashboard configuration](docs/DASHBOARD_GUIDE.md), [administration templates](docs/ADMINISTRATION_TEMPLATES.md), [component catalog](docs/COMPONENT_CATALOG.md), [API contracts](docs/BACKEND_ADMINISTRATION_CONTRACT.md), [screenshot comparisons](docs/design/PHASE_6_COMPARISON.md), [quality results](docs/PHASE_6_COMPLETION.md) and [remaining issues](docs/KNOWN_LIMITATIONS.md). Production requires the documented backend. Development fixtures and drafts are memory-only; no IAM operation is claimed complete without corresponding backend behavior.

The phase notes below retain historical implementation context; the Phase 6 report is the current integration status.

# Phase 5 enterprise grid

Development routes: `/dev/grid/client`, `/dev/grid/server`, `/dev/grid/export`, `/dev/grid/selection` (administrator showcase permission). Shared APIs are under `src/app/shared/grid`. See [grid usage, export security, backend contracts, dependency review and verification](docs/PHASE_5_GRID.md). AG Grid Community and lazy ExcelJS are used; no Enterprise license features are required. Large export jobs remain a mock frontend contract until backend integration.

# Phase 4 feedback and interactions

Development routes: `/dev/feedback`, `/dev/wizard`, `/dev/notifications` (administrator showcase permission required). The header bell and `/notifications` now use typed providers. See [Phase 4 API, backend contract, design evidence and verification](docs/PHASE_4_FEEDBACK.md). Production selects the API notification adapter; the mock fixtures and all development showcases are excluded.

# Phase 3 component library

Standalone controls are exported from `src/app/shared/ui`. Start development mode, sign in as the documented administrator, and open `/dev/components` for interactive form states and copyable examples. See [component APIs, design evidence and limitations](docs/PHASE_3_COMPONENTS.md). The showcase is excluded from production.

# SmartiamFrontend

Phase 2 adds guarded login/logout, My Profile, permissions and idle sessions. Run `npm.cmd start` for development mock mode; use `admin@example.test` or `reader@example.test` with the public fixture password `Demo-only!23`. Sessions are memory-only and require sign-in after reload. Production builds use the BFF and exclude mock credentials/showcase code. See [Phase 2 usage/security/verification](docs/PHASE_2_AUTH.md) and [required backend endpoints](docs/BACKEND_AUTH_CONTRACT.md). `npm.cmd run verify:production-auth` checks a production build for development auth code.

The working [Phase 1B administration shell](docs/design/PHASE_1B.md) uses the [Phase 1A analysis](docs/design/DESIGN_ANALYSIS.md), [central tokens](src/design/tokens.css) and [253-screen manifest](docs/design/SCREEN_MANIFEST.md). Open `/administration` or `/dashboard` for the mock dashboard. “System Actions” previews loading, empty and error states; all data is read-only sample data. Nested navigation, breadcrumb links, theme selection, page/role search and notification/profile placeholders work. Business administration and authentication remain future phases.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.43.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
npm run test:e2e
```

Playwright uses installed Google Chrome and starts the development server automatically. Run `npm run test:unit` for headless component tests, `npm run typecheck` for strict TypeScript validation and `npm run build` for the production bundle. Run `npm run test:visual:update` only when intentionally reviewing and updating the implementation snapshots. These snapshots are regression baselines, not proof of equality with approved source images. There is no lint configuration in the starter; type checking is available, but is not a lint substitute.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
