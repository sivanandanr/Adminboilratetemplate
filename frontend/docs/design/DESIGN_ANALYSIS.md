# SmartIAM Phase 1A — Screenshot analysis and design-system recommendation

## Scope and method

This is an analysis-only deliverable. No application implementation, dependency changes, or CSS token changes are part of this phase. Application code already present from the earlier task is outside this review's change scope; its existence does not establish reference fidelity. Earlier `DESIGN-SYSTEM.md` and `VERIFICATION.md` describe that earlier work. The three Phase 1A documents describe the proposed visual system, its evidence and unresolved decisions.

Both root `AGENTS.md` and `frontend/AGENTS.md` were read. All **253 original PNG files**, UI-001 through UI-253, were inventoried and visually reviewed in 13 sequential labelled contact sheets. The [screen manifest](SCREEN_MANIFEST.md) identifies every image, source filename, dimensions, dominant screen type, visual family and review notes. Descriptive titles are not verified OCR transcriptions or inferred functional requirements.

UI-007, UI-037, UI-181, UI-244 and UI-246 were additionally inspected at original resolution. Colors were extracted from original PNGs with `System.Drawing.Bitmap.GetPixel`, never from contact sheets or the existing application's CSS. All 253 original file hashes were checked against the existing JSON inventory. Raster samples are exact observations of image pixels, **not recovered source CSS**. Gradients, texture, antialiasing, unknown rendering scale and image generation/compression history limit reconstruction. Typography and geometry remain estimates. No pixel-perfect fidelity or WCAG conformance is claimed from screenshots.

## Inventory findings

The dominant structures are 77 data lists/worklists, 45 configuration forms/editors, 42 wizard/review steps, 31 record details/investigations, 24 rule/workflow designers, 20 dashboards/overviews, two permission matrices and one report builder. Ten images are multi-screen composites, and UI-002 is a roadmap/coverage infographic. Composite sub-screens are not counted as separate files.

The visual-family catalogue records 201 navy-sidebar/light-content references, 16 pale-sidebar/light-content references, 17 fully dark-content references, six prominent navy/light blue-accent variants, two RequestHub-branded references, ten composites and one infographic. These are structural review categories, not proof that every member shares identical colors, header, logo or navigation taxonomy.

The earlier machine-readable inventory has several issues: UI-010 depicts Retry Management rather than Delegation Management; UI-018 is a dense single non-connected-system configuration workspace rather than a montage. UI-007 has a pale sidebar, while UI-009/UI-222 have dark RequestHub navigation and UI-228/UI-244 have navy navigation. The new Markdown manifest records these corrections without silently rewriting historical tooling.

## Recommended reference hierarchy

| Responsibility | Recommended reference | Reason / boundary |
| --- | --- | --- |
| Administration shell, header, sidebar, active navigation, panel language and primary actions | [UI-246](SCREEN_MANIFEST.md#ui-246) | Complete administration composition with readable navigation, KPI cards, configuration tiles, table, activity and health panels. Use this as the canonical shell recommendation. |
| Alternative administration dashboard content | [UI-204](SCREEN_MANIFEST.md#ui-204) | Supports KPI/chart/activity organization; do not use its different navigation/header details to override UI-246. |
| General administration list, filtering and selected-record panel | [UI-181](SCREEN_MANIFEST.md#ui-181) | Clear toolbar, grid, selected row, badges, pagination and record context. Its title-in-header layout is a variant, not the proposed global shell. |
| Form controls and grouped settings | [UI-037](SCREEN_MANIFEST.md#ui-037), [UI-239](SCREEN_MANIFEST.md#ui-239) | Labels, field borders, switches, validation and panel grouping. UI-037's dark top header and tighter density are not adopted as shell defaults. |
| Multi-step configuration positioning | [UI-007](SCREEN_MANIFEST.md#ui-007), [UI-149](SCREEN_MANIFEST.md#ui-149) | Step navigation and bottom Back/Save Draft/Continue pattern. UI-007's pale sidebar is excluded from the proposed default shell. |
| Workflow designer and property panels | [UI-015](SCREEN_MANIFEST.md#ui-015), [UI-233](SCREEN_MANIFEST.md#ui-233) | Palette/list on left, canvas in center, properties at right. This is a feature layout within the shell. |
| Permissions matrix | [UI-035](SCREEN_MANIFEST.md#ui-035), [UI-134](SCREEN_MANIFEST.md#ui-134) | Matrix-specific density and cell indicators; not the general grid default. |

This hierarchy is a recommendation based on approved source images. It does not assert that the user has approved one variant as superseding all others. Where references conflict, use UI-246 for shell decisions and seek design resolution before applying an alternative.

## Common visual language

### Page, sidebar and header

The recurring administration layout separates a deep navy navigation rail from a very light lavender/near-white workspace. White or near-white bordered panels group content. Purple is the dominant primary-action, selected-step and active-navigation accent. UI-246 also uses blue, green and orange icon/tile tints as secondary category cues; these should remain semantic variants rather than arbitrary replacement primary colors.

The sidebar begins with SmartIAM branding, followed by icon-and-label navigation, chevrons on expandable groups, and indented child items. An expanded parent has a bright purple treatment; the active child uses a darker purple. Labels are white/light, left aligned. Sidebar widths and group order differ between images. Icons are thin outline glyphs; exact icon-library identity cannot be established from pixels. Lucide is the repository's required implementation library, not a verified identification of the artwork.

UI-246 has a pale top header **to the right of the sidebar**, with breadcrumb/context at left and search, notification/help/settings/app controls and profile at right. UI-037 instead has a dark full-width top bar. UI-181 puts the page title and supporting text in the upper header area. These are distinct structures, not interchangeable parts of one exact layout.

### Cards and hierarchy

UI-246 places a title with a purple icon tile at upper left and page actions at upper right. A horizontal KPI row follows, then a configuration-tile panel. The lower area has a broad working panel and narrower supporting activity/health column. KPI cards use large bold values, smaller labels and compact trend/status text. Panel headers use bold dark text with a leading outline icon. Cards have small-to-medium radii, thin cool lavender borders and faint downward shadows.

The rounded panel language is common, but not every screen is a dashboard. Preserve the list, form, wizard, detail and designer structures recorded in the manifest instead of forcing all pages into the UI-246 dashboard composition.

### Buttons, toolbars and positions

| Context | Repeated position and treatment | Evidence |
| --- | --- | --- |
| Global header | Breadcrumb/context left; search and utility/profile controls right | UI-246; dark-header alternative UI-037 |
| Page heading | Icon, title and description left; primary create/configure action and secondary action right | UI-246, UI-217 |
| Panel/grid title | Title and optional count left; Create, Import, Export or Refresh cluster right | UI-246, UI-181 |
| Filters | Search and selects above the grid; explicit Search/Reset in some screens, inline filtering in others | UI-181 versus UI-246 |
| Grid footer | Result range left; page size and pagination predominantly right | UI-246; page-size position differs in UI-037 |
| Wizard footer | Back lower left; Save Draft then Continue/Next/Publish lower right | UI-007, UI-149 |
| Form panel action | Test/Save aligned to the panel's right/bottom edge; avoid a second unrelated page-level primary action | UI-037 |
| Record actions | Near record title or in a dedicated administrative action group | UI-181, UI-199 |

Primary actions are filled purple with light text. Secondary actions are near-white, bordered, with dark/purple text and outline icons. Danger actions combine red text/icon or border with a light surface; approval/rejection workspaces may use green/red actions. Compact icon-only controls occur beside rows and in toolbars. Exact hover, pressed, disabled, focus and loading states cannot be established from the static screenshots.

### Grids, lists and details

UI-246 uses a very pale lavender header, near-white rows, fine horizontal separators, compact status/category pills and outline row actions at right. UI-181 shows purple record links, checkboxes, a lavender selected row, colored avatars, neutral/green/red badges and a large right-side detail panel with its own tabs. Neither image proves an AG Grid theme or configuration; AG Grid Community is the required future implementation choice.

The shared target should support a regular approximately 40 px row and an explicitly separate compact approximately 28 px row. Those CSS numbers are provisional normalizations: UI-037 has roughly 24 px template-table rows, whereas UI-181 and UI-246 have roughly 39–43 px rows. Do not claim these are identical densities. Column headers are stronger than cell text; numeric/count fields align consistently within their columns; status text must remain readable alongside color.

A right-side panel in a screenshot may be a persistent split view, not a modal drawer. UI-181 is best treated as a desktop master/detail reference until interaction requirements determine dismissal, focus and responsive behavior.

### Forms and status feedback

UI-037 groups labels above compact white fields in two-column panels. Thin cool borders, modest corners, red required markers, purple switches/radios and underlined active tabs recur. It also has side-by-side test/configuration panels, a green success message and a template list/detail workspace. UI-239 supports the settings-section pattern. Required markers and success/error colors need text equivalents; screenshots do not establish accessible validation behavior.

Semantic colors recur: green for active/connected/completed, red for locked/failed/revoke/high risk, amber/orange for pending/exception/warning, blue for informational/modify/category cues, neutral gray for inactive, and purple for selection/draft/system categories. Meanings vary by feature: **purple is not inherently success**, and a blue Business category badge is not evidence for an information-alert state. The [token register](DESIGN_TOKENS.md) separates these uses and marks proposed semantic mappings.

## Typography, spacing and dimensions

The screenshots show a compact sans-serif interface, bold black/dark-navy headings, medium-weight labels, smaller supporting text and larger KPI numerals. There are no supplied font files, CSS, browser zoom settings or design metadata sufficient to identify font family, font-size declarations, line-height or exact weight. Font identity remains unresolved; Arial/Helvetica is only a provisional fallback recommendation, not an extraction.

At UI-246's 1672 x 941 raster size, the sidebar boundary is approximately x=274, the pale header ends around y=49, the title/icon region spans roughly y=62–118, KPI cards span roughly y=136–224, and the configuration panel spans roughly x=291–1659/y=239–370. Panel gutters are approximately 14–17 px. UI-181's sidebar boundary is near x=248; UI-037's near x=235. UI-007's pale-sidebar boundary is near x=218. These estimates are image-space boundaries, not proof of responsive CSS or a universal scale.

The proposed starting rhythm is 4/8/12/16/24/32 px with 16 px normal content gutters, an approximately 50 px desktop header and 274 px expanded navigation. Title size 26 px, panel title 18 px, body 14 px and metadata 12 px are provisional fitting targets. The complete dimensions, radii, density variants and confidence labels are in `DESIGN_TOKENS.md`. Shadow blur/opacity cannot be uniquely reconstructed; retain it as a review item rather than asserting an exact box-shadow.

## Inconsistencies requiring review

| ID | Difference and examples | Proposed resolution / question for design review |
| --- | --- | --- |
| I-01 | Navy navigation in UI-246/UI-181 versus pale navigation in UI-007/UI-121/UI-242 | Recommend navy for administration. Treat pale navigation as a separately approved variant if retained. |
| I-02 | Light workspace in UI-246 versus fully dark navy/purple in UI-019/UI-094 and dark teal in UI-178/UI-179 | Keep dark themes separate. Do not mix dark panel/input colors into the light baseline. |
| I-03 | Purple primary in UI-246 versus blue-primary designer variants UI-219/UI-220/UI-244/UI-247/UI-250/UI-252; teal in UI-178 | Recommend purple administration primary. Review whether blue denotes a separate product variant or a feature-specific mode. |
| I-04 | UI-009 and UI-222 display RequestHub branding and a different navigation taxonomy; SmartIAM shield/stacked marks also vary | Exclude RequestHub from SmartIAM brand decisions. Request the authoritative logo asset before implementation; no substitute should be called the approved logo. |
| I-05 | Pale right-side header in UI-246, full dark top bar in UI-037, page-title header in UI-181, additional top module navigation in UI-153/UI-231 | Recommend UI-246 shell structure. Use UI-037/UI-181 only for their designated component patterns. |
| I-06 | Approximate sidebar widths 274/248/235/218 px in UI-246/UI-181/UI-037/UI-007; differing menu labels and grouping | Recommend 274 px at the primary reference size. Settle navigation taxonomy separately; image labels are not route requirements. |
| I-07 | Approximately 39–43 px rows in UI-181/UI-246 versus approximately 24 px rows and 26 px inputs in UI-037 | Define explicit regular/compact variants; do not resize all screens to the densest reference. Validate target sizes and zoom in implementation. |
| I-08 | Bright green badges in UI-037 versus softer mint in UI-181/UI-246; gray/lavender grid headers; different purple button gradients | Adopt UI-246's softer semantics as the administration direction. Document normalized tokens as proposals, preserving measured alternatives. |
| I-09 | UI-181 has filter Search/Reset and a record panel; UI-246 has inline filters and activity/health panels; wizard footer action orders/labels vary | Define layout recipes by task. Confirm which forms use explicit submission versus immediate filter application. |
| I-10 | Composites UI-001/UI-076/UI-163/UI-164/UI-210/UI-211/UI-212/UI-226/UI-249/UI-253 and roadmap UI-002; some tiny text is ambiguous | Use for coverage and composition only. Measure original single-screen anchors. Do not interpret roadmap green checks as implemented or verified behavior. |

Additional unresolved evidence: exact font and brand assets; token values for hover/pressed/disabled/focus/loading; mobile layouts; expanded-versus-collapsed rail appearance; modal/backdrop and toast lifecycles; keyboard interaction; permission visibility; error behavior. A Collapse control is visible in UI-244, but a control label is not a screenshot of the collapsed state. No reviewed image establishes a dedicated mobile-shell baseline or a complete interaction specification. Embedded overlays in collages require separate readable references before exact component reconstruction.

## Proposed coherent system

Recommend a **navy-navigation, light-lavender administration theme**, anchored to UI-246, with a pale contextual header, near-white bordered cards, purple primary/active treatments, dark text and restrained semantic status tints. Preserve the reference's distinct category tile colors. Use compact outline icons with text labels, a clear page/panel/action hierarchy, and regular/compact density recipes instead of mixing screenshot scales. Keep shell, page-heading, grid-toolbar, form-section, wizard-footer and master/detail compositions reusable and independent of business modules.

The Angular architecture target remains the repository's Angular 20 standalone, zoneless Signals/OnPush, lazy routes, typed Reactive Forms, centralized CSS tokens, Tailwind v4, Lucide and AG Grid Community. This is a later implementation recommendation only. Tailwind's generic palette must not replace the measured colors, and a library's default theme must not be described as screenshot-equivalent.

Before implementation, resolve I-01 through I-08 where a single default is needed, confirm the font/logo and normal/compact dimensions, and approve the canonical shell reference. Later verification should render at the primary reference's dimensions, compare regions against that exact source, document intentional differences, test responsive layouts separately and check keyboard/screen-reader/contrast behavior. A visual regression baseline of an implementation alone does not demonstrate similarity to the approved images.

## Deliverable verification

This phase creates `DESIGN_ANALYSIS.md`, `SCREEN_MANIFEST.md` and `DESIGN_TOKENS.md`. Inventory completeness, image dimensions/hashes, source links, token provenance and document cross-links are checked. No application build or functional-test result is claimed for documentation-only work. Existing source files and screenshot originals are retained unchanged.
