# SmartIAM visual reference and shell

Historical initial-shell notes. For the current implementation, corrected header mapping and remaining visual differences, see [Phase 1B](PHASE_1B.md); Phase 1A's [token register](DESIGN_TOKENS.md) remains the evidence catalogue.

All 253 PNGs in `screenshots/` were visually inspected in sequential, labelled contact sheets (20 images per sheet). UI-246, UI-181 and UI-037 were also inspected at full resolution. `screen-reference-manifest.json` inventories every original with its title, dimensions, SHA-256, observed family and role. Titles are descriptive catalogue labels, not guaranteed OCR transcriptions. Run `catalog-references.ps1` to refresh metadata without altering originals; add `-ContactSheets` to regenerate the ignored review images. Thumbnails are for inventory inspection, not color extraction or geometry measurements.

## Baseline selection

UI-246 is the primary administration shell anchor: a navy left sidebar, pale lavender content, almost white header, purple active navigation and primary actions. UI-181 supports navigation, tables and filters; UI-037 supports inputs, tabs and forms. The collection also contains light sidebars, fully dark navy/teal screens, collages and a roadmap. These variants cannot all be matched by a single theme. Selecting the recurring navy/light administration family is an implementation decision, not a claim that one screenshot supersedes the other approved references.

## Verified color extraction

Coordinates are original image pixels, origin at top left. Samples use System.Drawing.GetPixel on UI-246 (1672 × 941), without scaling or interpolation. Gradients and antialiasing mean nearby pixels differ. The implementation uses flat representative colors.

| Token | Value | Evidence |
| --- | --- | --- |
| Sidebar | `#000D2B` | pixel (8,400); (120,800) is `#000E2C`, showing variation |
| Canvas | `#F4F2FD` | pixel (280,55); (280,900) is `#F6F6FC` |
| Surface | `#FFFFFF` | pixel (310,580) |
| Header | `#FCFCFE` | pixel (310,390), a near-white panel sample; header itself is a varying near-white field, so its reuse for header is provisional |
| Primary | `#6502FC` | pixel (1210,90), inside Create Configuration |
| Text | `#000000` | 329 exact pixels in rectangle x=370..599,y=60..99 |
| Soft purple | `#F0EBFD` | most common color (224 pixels) in x=310..359,y=285..339 |
| Active submenu | `#3C2994` | most common color (108 pixels) in x=40..254,y=525..547 |

`src/design/tokens.css` is the only palette source. Secondary text, border, hover, muted sidebar text, focus, overlay and shadow tokens are provisional approximations chosen for readable interaction, not asserted samples. White sidebar/action text is visibly present; its exact original text rendering cannot be reconstructed.

## Geometry, typography and controls

- UI-246 sidebar is about 274 px wide, with a roughly 50 px header. Shell uses 274 px and a 56 px header for controls; these are estimates, not original CSS.
- Headings are bold black, supporting text is smaller and dark navy. Original font files and font metadata are unavailable. Arial/Helvetica is a provisional local fallback; 26 px page titles, 18 px panel titles, 13–14 px body text.
- Reference spacing repeats roughly 8/12/16/24 px steps. Sidebar items are about 34–40 px high. Shell tokens adopt a 4 px spacing base and a 36 px control height.
- Main title/icon sits upper left; primary actions sit upper right. Panel actions sit on the right of panel titles; wizard Back is lower left and Continue/Save is lower right.
- Buttons are compact, purple filled for primary actions and white with pale violet borders for secondary actions. Slightly rounded rectangles; visible outline icons precede labels.
- UI-181 tables use a pale lavender header, white rows, fine separators, purple links, tinted selected rows, compact badges, toolbar actions above right and pagination below right. These appearances are documented for later AG Grid work; no grid is implemented in this shell phase.
- UI-037 forms use dark labels above compact white inputs, thin lavender borders, small radii, purple switches, purple underlined tabs, red required indicators and green success panels. Typed forms are a later phase.
- Outline icons use consistent thin strokes. Lucide is the required approximation; the exact screenshot glyph set and SmartIAM logo asset are unavailable. The shield brand mark is provisional.
- Panels use faint lavender borders, approximately 6–10 px corners and subtle bottom shadows. Exact shadow and radius values cannot be recovered from raster references.

## Scope and visible differences

The shell supplies standalone OnPush components, zoneless Signals state, lazy routes, collapsible navigation, mobile overlay, skip link, focus indicators, active-route semantics and page titles. Administration configuration links work; each future feature explicitly states its implementation/integration status. No simulated users, session, health metrics or activity are presented as live data.

UI-246's KPI cards, role grid, recent activity, search, notifications and user menu require later features and real services. They are omitted from the shell instead of adding nonfunctional controls. Platform navigation follows UI-246's order; unimplemented modules have explicit placeholder routes, and only Administration has a submenu in this phase. The top-right workspace label/icon does not represent an authenticated profile. The landing page is a shell entry point, not a recreation of the administration dashboard. Colorful configuration tiles are normalized to the sampled purple tint. Mobile layout and collapsed width (68 px) are provisional because no dedicated mobile/collapsed references exist.

No pixel-perfect fidelity is claimed. Playwright snapshots establish an implementation regression baseline, not equality with the approved screenshots. Reference comparison must account for the above scope differences.

## Reuse

Use `.button`, `.button-primary`, `.panel`, `.page-heading` and `.heading-icon` with semantic HTML; global styles consume tokens. Example: `<a class="button button-primary" routerLink="/administration/system">System Configuration</a>`. `iam-icon` accepts a typed icon name and size and is decorative: place an accessible label on its enclosing control. Avoid business logic in these shared primitives. No facade/factory/adapter is introduced until a feature requires it.

Dependencies added: Tailwind v4 and its PostCSS adapter for the mandated styling stack; Lucide Angular for required outline icons; Playwright and axe as development-only behavior, visual and accessibility checks. AG Grid/ExcelJS are deferred until the grid/export phase.
