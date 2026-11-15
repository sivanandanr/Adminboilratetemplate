# Part 4 plan

Scope: shell scrolling/footer, shared grid/table/pager containment, drawer/tabs dirty protection, accordion groups, breadcrumb semantics and one semantic status badge. No feature-page migrations, new demo route or Part 5 idle redesign.

- Desktop shell owns a fixed viewport with independent sidebar/content scrolling and a footer beneath the content column. Mobile preserves document scrolling and wraps the footer at the end. Existing root feedback outlets remain singletons for both authentication and authenticated routes; the shell owns loading/offline outlets.
- Footer metadata is typed injectable configuration (current package version and environment); deployment supplies approved Privacy/Terms/Help URLs. Missing destinations are visibly unavailable rather than fabricated legal pages.
- AG Grid keeps its own sticky header and horizontal scroll. Bound the shared card to available desktop content space and pin its existing pager. Native shared tables contain their own horizontal scroll. No page-specific table rewrites.
- Drawer composes SmartModal for queue/focus/scroll locking, adds a full-height side presentation, a scrolling body and projected footer, and reuses registered form discard confirmation. Tabs reuse the same scoped form lifecycle for user navigation while preserving current appearance and keyboard API.
- Optional single-open accordion groups and Complete/Needs your input badges; a central semantic StatusBadge adapts the legacy badge APIs and risk mapping. Breadcrumb always renders its last item as current text, with real parent links.
- Add component/service/browser tests, inspect desktop/mobile/light/dark screenshots, run typecheck, build and production isolation checks. Stop before Part 5.

Implemented and verified shared sticky form footers and measured task-panel scroll clearance as part of scroll ownership; no new business logic or dependencies. Drawer footer projection also recognizes existing form action toolbars.
