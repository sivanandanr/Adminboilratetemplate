
# SmartIAM Admin Boilerplate — Master Engineering Rules

## 1. Project Objective

Develop a production-oriented, reusable enterprise
administration frontend template.

The template will initially support SmartIAM and must
be reusable for other enterprise applications.

The application must provide:
- Authentication and session management
- Enterprise administration layout
- Collapsible and expandable navigation
- Reusable UI component library
- Data grids and exports
- Notifications and dialogs
- Dashboards
- Forms and wizards
- Profile management
- Permission-aware UI
- Responsive and accessible design

This is a working application foundation,
not a static UI demonstration.

## 2. Technology Stack

Frontend:
- Angular 20
- Standalone components
- Zoneless change detection
- TypeScript strict mode
- Angular Signals
- Typed Reactive Forms
- Tailwind CSS v4
- AG Grid Community
- Lucide Angular icons
- ExcelJS for XLSX exports
- Playwright for end-to-end and visual testing

Future backend integration:
- ASP.NET Core 10 Minimal API
- YARP API Gateway
- SQL Server / PostgreSQL

Do not introduce additional major dependencies
without documenting their necessity.

## 3. Instruction Hierarchy

Before implementation, read:
1. This root AGENTS.md.
2. frontend/AGENTS.md.
3. Applicable design and coding standards.
4. Approved screenshots and design references.
5. Relevant functional requirements.

Follow the most specific applicable instructions
unless they conflict with mandatory security rules.

## 4. Screenshot-Driven Design

Approved SmartIAM screenshots are the visual baseline.

Implement the same:
- Background and surface colors
- Header and sidebar colors
- Typography and text hierarchy
- Spacing and alignment
- Buttons and their positions
- Navigation and icons
- Grids and forms
- Cards, borders, shadows, and radius
- Dialogs, drawers, toasts, and wizards

Extract verified design values into centralized
design tokens.

Do not invent colors and claim visual equivalence.

If reference screenshots are unavailable,
document provisional design decisions.

Do not independently redesign approved screens.

## 5. Architecture Principles

Apply:
- SOLID principles where appropriate
- Separation of concerns
- DRY without unnecessary abstraction
- KISS
- Composition over inheritance
- Feature-based architecture
- Dependency injection
- Strong typing
- Reusable components
- Testable services
- Explicit interfaces and contracts

Avoid premature abstraction and overengineering.

## 6. Design Pattern Guidelines

Use patterns where they solve a real problem:

Facade:
- Feature-level orchestration
- Authentication state
- Dashboard data coordination

Adapter:
- Backend API integration
- Mock API providers
- External authentication providers

Strategy:
- Authentication providers
- Client/server grid data sources
- Export implementations

Factory:
- Configurable dialogs
- Dynamic dashboard widgets

Observer / Reactive State:
- Angular Signals
- RxJS asynchronous streams

Composition:
- Forms
- Layouts
- Reusable UI controls

Document the reason for nontrivial patterns.

Do not apply patterns unnecessarily.

## 7. Reusable Component Rules

All reusable UI controls must:
- Use centralized design tokens
- Follow approved visual styling
- Be independent of business modules
- Support keyboard interaction
- Support accessibility requirements
- Provide loading/error/disabled states
- Expose typed APIs
- Include tests and usage examples

Avoid duplicating shared components.

## 8. Security Requirements

- Never hardcode secrets or credentials.
- Never store authentication tokens in
  localStorage or sessionStorage.
- Prefer secure HttpOnly server sessions.
- Never trust frontend authorization alone.
- Validate input on the backend.
- Avoid unsafe HTML injection.
- Protect against open redirects.
- Sanitize spreadsheet exports against
  formula injection.
- Avoid exposing sensitive data in logs.
- Keep mock authentication isolated from production.
- Follow least-privilege principles.

## 9. Performance Requirements

- Lazy-load feature routes.
- Use OnPush change detection.
- Use Signals for synchronous UI state.
- Use RxJS for asynchronous operations.
- Avoid unnecessary subscriptions.
- Cancel obsolete HTTP requests.
- Support server-side pagination for large datasets.
- Avoid rendering excessive DOM elements.
- Monitor bundle size and runtime performance.

## 10. Accessibility Requirements

Target WCAG 2.2 AA.

Support:
- Keyboard navigation
- Visible focus indicators
- Accessible labels
- Screen-reader announcements
- Dialog focus management
- Sufficient color contrast
- Responsive zoom and reflow
- Accessible validation feedback

## 11. Coding Standards

- Strict TypeScript.
- Descriptive names.
- Small focused components.
- No unexplained any types.
- No unused imports or variables.
- No duplicated business logic.
- No hardcoded API endpoints.
- No direct HTTP calls from generic UI controls.
- No business-specific logic inside shared components.
- Use consistent file and folder naming.
- Keep components maintainable and testable.

## 12. Testing Requirements

For relevant changes, implement:
- Unit tests
- Component tests
- Integration tests
- Playwright end-to-end tests
- Screenshot visual regression tests
- Accessibility checks

Tests must verify actual behavior.

Never claim tests passed unless executed.

## 13. Definition of Done

A task is complete only when:
1. Requirements are implemented.
2. Code follows architecture standards.
3. Build succeeds.
4. Relevant tests pass.
5. Security considerations are reviewed.
6. Accessibility is checked.
7. Responsive behavior is verified.
8. Screenshot alignment is reviewed.
9. Documentation is updated.
10. Remaining gaps are explicitly reported.

## 14. Implementation Workflow

For each development task:

1. Inspect the repository.
2. Read applicable AGENTS.md files.
3. Review requirements and screenshots.
4. Produce a short implementation plan.
5. Identify reusable components.
6. Implement the smallest complete feature.
7. Run build and relevant tests.
8. Review visual and functional behavior.
9. Document the result.
10. Report unresolved issues.

Do not recreate the Angular project.
Do not overwrite unrelated code.
Do not modify approved designs without authorization.

## 15. Git Workflow

- Use feature branches for development.
- Keep changes focused.
- Write meaningful commit messages.
- Never commit secrets or generated build outputs.
- Review changes before committing.
- Do not push or merge without explicit approval.

## 16. Execution Priorities

Implement in this order:

Phase 1:
Design system and administration shell.

Phase 2:
Authentication, logout, profile, session management.

Phase 3:
Reusable form controls and buttons.

Phase 4:
Dialogs, notifications, progress bars, wizards.

Phase 5:
Enterprise grids, pagination, CSV/XLSX export.

Phase 6:
Dashboards, administration templates,
component showcase.

Phase 7:
Visual regression, accessibility, security,
performance, and integration testing.

Complete and verify each phase before starting
the next phase.
## UI rules
- Keep the existing fonts. Never hard-code colors in components; use the semantic theme tokens.
- Use the shared Button, StatusBadge, Toast, Dialog, BlockUi, Idle and unsaved-changes patterns. See docs/ui-patterns.md.
- One solid main button per screen. Approve, reject, delete, remove and withdraw always ask for confirmation.