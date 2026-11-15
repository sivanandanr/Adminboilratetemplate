# SmartIAM proposed design tokens — Phase 1A

The Phase 1A evidence below is retained. [Phase 1B](PHASE_1B.md) documents the authorized CSS realization, additional category/dark samples, provisional interaction choices and current screenshot discrepancies.

This is a **documentation-only token proposal**, not CSS implementation. The sources are the approved original PNGs linked in [SCREEN_MANIFEST.md](SCREEN_MANIFEST.md). UI-246 is the recommended administration anchor; UI-181, UI-037 and UI-007 support specific component/status observations. No generic Tailwind palette was substituted, and existing application CSS was not used as extraction evidence.

## Evidence notation and reproduction

- **M — measured raster sample:** exact RGB read from an original PNG, or an exact color occurring in a stated rectangle. This does not identify the original CSS declaration.
- **E — estimated geometry/type:** visually estimated at the stated image dimensions; requires fitting and comparison when implemented.
- **P — provisional decision:** normalized CSS value, semantic mapping, font fallback or interaction behavior not directly recoverable from pixels.

All listed point/rectangle coordinates use original image pixels with origin at top left. For rectangles, `(x0,y0)-(x1,y1)` includes the first corner and excludes x1/y1. UI-246, UI-181, UI-037, UI-007 and UI-244 are each 1672 x 941 pixels. The color extraction used `System.Drawing.Bitmap.GetPixel(x,y)` without resizing or interpolation. Reproduce a point, for example, by opening the manifest's UI-246 filename as a bitmap and reading `(1210,90)`: RGB `(101,2,252)` -> `#6502FC`. For a region, count exact RGB triples and sort by frequency; do not quantize to Tailwind colors.

Apparently flat image regions contain many adjacent RGB values. Counts below document this uncertainty. A representative flat CSS color selected from the samples is **P even when the sampled RGB itself is M**. Applying one sampled color globally is a proposed normalization, not a claim of pixel identity.

## Primary palette and surfaces

| Proposed semantic token | Sample / candidate | Original evidence | Confidence / proposed use |
| --- | --- | --- | --- |
| `color.page` | `#F4F2FD` | UI-246 pixel (280,55); also most frequent color in (280,55)-(290,100): 93/450 pixels | M sample; P representative canvas. Same image at (280,900) is `#F6F6FC`, so canvas is not flat. |
| `color.sidebar` | `#000D2B` | UI-246 pixel (8,400) | M sample; P representative sidebar. Nearby region (5,390)-(15,450) has mode `#000E2C` (141/600 pixels), showing variation. |
| `color.header` | `#F5F4FE` | UI-246 pixel (900,20); mode in blank header region (700,5)-(950,40), 1931/8750 pixels | M sample from the actual top header; P flattening. |
| `color.card` | `#FBFAFE` | UI-246 pixel (800,260); 196/1200 pixels in (790,250)-(850,270) | M sample; P representative panel. That region's mode is `#FAFAFE` (200/1200), nearly tied. |
| `color.surface-white` | `#FFFFFF` | UI-246 pixel (310,580), white table/control area | M sample. P reusable white input/control surface; do not assume every card is exactly white. |
| `color.primary` | `#6502FC` | UI-246 pixel (1210,90), Create Configuration button interior | M sample; P primary action/active accent. Region (1205,80)-(1230,88) instead has mode `#6404FD` (17/200): the button is textured/gradient, not a flat swatch. |
| `color.primary-soft` | `#F0EBFD` | UI-246 region (310,285)-(360,340), first configuration tile; mode 224/2750 | M region value; P soft purple category/icon backing. |
| `color.sidebar-active-child` | `#3C2994` | UI-246 region (40,525)-(255,548), Admin Dashboard child; mode 108/4945 | M region value; P active submenu fill. Broad tonal variation prevents recovering one original flat color. |
| `color.text-primary` | `#000000` | UI-246 title rectangle (370,60)-(600,100), 329 exact black pixels | M glyph pixels; P heading/body default. Font antialiasing produces other edge colors. |
| `color.text-secondary` | `#000026` | UI-246 subtitle rectangle (375,98)-(730,117); most frequent dark sample (13 pixels), counting only pixels whose R/G/B are each below 100 | M sampled dark-navy glyph color; low-confidence P secondary text candidate, not a recovered font color. |
| `color.on-primary` / `color.on-sidebar` | `#FFFFFF` candidate | Light text is visible on UI-246's primary button/nav; white RGB is independently measured at (310,580) | P semantic reuse of measured white; exact text fill is unverified. Check actual foreground/background contrast when rendered. |
| `color.border-panel` | `#E4E4FA` | UI-246 pixel (900,384), upper edge of lower working panel | M edge pixel; P flattened panel border. It may include antialiasing/compositing; not proof of the CSS stroke color. |
| `color.border-control` | `#D7DCFE` | UI-246 pixel (800,512), Role Type filter upper border | M edge pixel; P regular control-border candidate. UI-181 differs; retain alternatives below. |
| `color.control-fill` | `#FBFAFD` | UI-246 pixel (880,524), blank part of Role Type control | M sample; P regular control fill. White is a supported alternate for forms. |
| `color.secondary-button-fill` | `#FCFBFE` | UI-246 pixel (1500,110), System Actions button interior | M sample; P secondary action fill; near-white gradient variation remains. |

The previous analysis used `#FCFCFE` from UI-246 `(310,390)` as a pale surface and provisionally reused it for the header. That coordinate is a panel, **not the top header**. This Phase 1A proposal uses the actual header sample `(900,20)` and does not silently treat the older provisional value as verified header evidence.

UI-246's category tiles retain distinct tints: purple roles, blue system settings, warm notification settings, green audit, purple scheduler. Exact full tile palettes remain provisional beyond the measured purple sample. Do not normalize all tiles to purple and claim full screenshot equivalence, and do not invent blue/green/orange hex values from generic palettes to complete them.

## Grid and form tokens

| Proposed token / role | Sample / candidate | Source evidence | Confidence / decision |
| --- | --- | --- | --- |
| `grid.header-fill` | `#F1F0FD` | UI-246 (800,566)-(840,577), mode 116/440 | M region value; P regular-grid header. |
| `grid.row-fill` | `#FBFBFE` | UI-246 (820,610)-(840,640), mode 67/600 | M region value; P row fill. White is also present elsewhere. |
| `grid.row-selected-fill` | `#EDE6FD` | UI-181 (700,438)-(800,445), selected row, mode 112/700 | M region value; P selected-row fill; UI-181 is supporting evidence, not a UI-246 selected-state screenshot. |
| `grid.link` / `tab.active` | `color.primary` candidate | Purple links/active indicators visible in UI-181 and UI-246 | P reuse of sampled primary; exact link/tab RGB not asserted. |
| `grid.separator` | `color.border-panel` candidate | Fine light separators visible in UI-246/UI-181 | P reuse; distinct separator CSS color not established. |
| `form.input-fill` | `#FEFEFE` | UI-037 (550,328)-(620,334), mode 92/420 | M region value; P near-white form surface. |
| `form.input-border` | `#E2E5EE` | UI-037 pixel (600,325), first configuration input upper edge | M edge sample; P compact form-border candidate. |
| Alternative input border | `#D5D9E5` | UI-181 pixel (1000,271), Account Status filter upper edge | M edge sample; palette/density discrepancy for review. Recommend UI-246 control border for regular controls until resolved. |
| Required marker | `#E23838` | UI-037 pixel (400,312), required indicator near Configuration Name | M glyph/antialias sample; P required-indicator candidate, not a verified source red. Pair with accessible text. |
| Alternative primary purple | `#5F0BB7` | UI-037 (1500,483)-(1530,488), Send Test Email button, mode 7/150 | M region value; P alternate only. Do not override UI-246 primary with this darker purple. |
| Alternative switch purple | `#640BB9` | UI-037 (908,274)-(918,285), enabled switch body, 4/110 pixels; tied mode | M region value; low-confidence P alternate. Recommend sampled primary for a coherent switch proposal, with fidelity tradeoff recorded. |

## Semantic status and category colors

Background tints are more reliable than tiny antialiased glyphs. The following are sampled candidates, not proof of one shared status palette across all screens. Their use as normalized semantic tokens is provisional.

| Proposed token / meaning | Sample / candidate | Source evidence | Limits / mapping |
| --- | --- | --- | --- |
| `status.success.fill` | `#D2F6DA` | UI-246 (1016,615)-(1045,619), Active badge top interior; mode 4/116 | M value with substantial pixel variation; P soft Active/Connected/Completed badge. |
| `status.success.message-fill` | `#DFF4E7` | UI-037 (1350,550)-(1450,560), success message blank area; mode 130/1000 | M region value; P success-banner fill. Keep badge and banner contexts distinct. |
| `status.success.text` | `#005F00` | UI-037 success-label region (1198,529)-(1480,546); six exact samples, most frequent among pixels with all channels below 100 | M glyph value; low-confidence P text candidate. Dark glyph sampling does not establish original CSS. |
| `status.danger.fill` | `#FEE4E6` | UI-181 (885,706)-(915,709), Locked badge upper interior; mode 13/90 | M region value; P Locked/Failed badge tint. |
| `status.danger.icon` | `#FD0000` | UI-007 (1280,760)-(1330,790), Revoke icon; two exact samples in red-filtered pixels, tied | M glyph value; low-confidence P icon candidate. Use readable dark text and an explicit label rather than relying on red. |
| `status.warning.fill` | `#FEF6E8` | UI-007 (1530,755)-(1640,770), Exception preview card; mode 162/1650 | M region value; P warning/exception fill. Mapping this feature card to a global alert is a proposal. |
| `status.warning.icon` | `#FD6600` | UI-007 (1510,750)-(1640,850), Exception card; two exact samples among orange pixels (R>180, 60<G<170, B<70) | M glyph value; low-confidence P icon candidate; default dark text proposed, not orange small text. |
| `status.info.fill` | `#EAF2FE` | UI-007 (1380,755)-(1490,770), Modify preview card; mode 179/1650 | M region value; P information-style tint derived from a Modify state, not a measured generic information alert. |
| `status.info.accent` | `#0043FC` | UI-007 (1380,760)-(1490,810), Modify icon; three exact samples among blue pixels (B>180, R<80, G<120), tied | M glyph value; low-confidence P information accent. Do not replace purple primary actions with blue. |
| `status.neutral.fill` | `#EBECF2` | UI-181 (865,740)-(930,760), Inactive badge region; mode 50/1300 among pixels with all channels >200 | M region value; P neutral/inactive badge. |
| `category.system.fill` | `#EDDCFE` | UI-246 (550,614)-(580,619), System badge; mode 10/150 | M region value; P category tint, **not success**. |
| `category.business.fill` | `#C8E5FE` | UI-246 (545,699)-(580,702), Business badge; mode 7/105 | M region value; P category tint, **not automatically information status**. |
| `category.operational.fill` | `#FFEADF` | UI-246 (545,779)-(580,783), Operational badge; mode 8/140 | M region value; P category tint, **not automatically warning status**. |

UI-181 also has a warmer pending-actions icon background (`#FEF2DC`, five pixels in `(1420,148)-(1440,158)`) and a red locked-users icon background (`#FDE6E9`, 16 pixels in `(1140,148)-(1160,158)`). UI-007's Revoke preview-card background has mode `#FEEEF2` (222 pixels in `(1250,755)-(1360,770)`). These alternatives demonstrate context/tonal inconsistency; they are not extra arbitrary colors to sprinkle through the UI.

Propose `color.text-secondary` for warning/neutral text until dark semantic foregrounds are reliably established; this reuses a source-derived dark color instead of inventing dark amber/gray. Any candidate status text, icon, border and background combination must be tested for contrast at its actual rendered size. No contrast compliance is inferred from a tint sample.

## Measured alternatives excluded from the default

| Variant | Measured value | Original evidence | Decision |
| --- | --- | --- | --- |
| Pale sidebar | `#EFECFD` | UI-007 (3,600)-(15,700), mode 267/1200 | Alternative navigation family; do not mix into the proposed navy administration shell. |
| Dark teal content | `#091A2C` | UI-178 (1200,200)-(1220,220), mode 147/400 | Alternative fully dark theme; excluded from light content. |
| Blue primary | `#1856FE` | UI-244 (1437,900)-(1450,910), Next button, three exact pixels with tied modes | Low-confidence raster sample of a blue-primary variant; not the administration primary. |

## Typography proposal

Every declaration in this table is **E/P**. Source pixels establish hierarchy, not the font file or original CSS. UI-246 and UI-181 are the primary sizing references; UI-037 supplies compact-form context.

| Proposed token | Provisional CSS target | Visual evidence / limit |
| --- | --- | --- |
| `font.family.ui` | Arial, Helvetica, sans-serif fallback | Sans-serif UI is visible across UI-246/UI-181/UI-037. Exact family unresolved; obtain the original font/brand specification. |
| `font.size.page-title` | 26 px | Bold Administration title in UI-246, roughly 25–28 px visual fit. |
| `font.size.panel-title` | 18 px | Administrative Configuration and panel headings in UI-246, roughly 17–20 px visual fit. |
| `font.size.body` | 14 px | Navigation, labels and supporting copy in UI-246/UI-181, roughly 13–15 px visual fit. |
| `font.size.small` | 12 px | Dense rows, badges and metadata in UI-181/UI-037, roughly 11–13 px visual fit. |
| `font.size.kpi` | 26 px | UI-246 KPI numerals; UI-181 has a similar strong numeric tier. |
| `font.weight.normal` | 400 | Supporting descriptions/cells. Numerical weight cannot be recovered. |
| `font.weight.label` | 600 | Form labels, navigation and action text. Numerical weight provisional. |
| `font.weight.heading` | 700 | Page/panel headings and KPI values. Numerical weight provisional. |
| `font.line-height.body` | 1.4 | Compact readable text rhythm in UI-246; not a recovered line-height declaration. |
| `font.line-height.heading` | 1.2 | Provisional fit for compact headings. |

## Geometry, spacing and density proposal

These are **E/P** image-space estimates and proposed CSS starting values at UI-246's 1672 x 941 reference size. They are not measurements of DOM boxes. Do not average widths from differently scaled screenshots and claim an original spacing system.

| Proposed token / component | Provisional value | Reference observation |
| --- | --- | --- |
| `layout.sidebar.expanded` | 274 px | UI-246 sidebar/right-header boundary near x=274. UI-181 ~248 px, UI-037 ~235 px and UI-007 ~218 px are alternatives. |
| `layout.header.height` | 50 px | UI-246 horizontal boundary near y=49. Do not label the earlier implementation's 56 px as extracted. |
| `layout.content.gutter` | 16 px | UI-246 main panels start near x=291, about 17 px beyond sidebar; panel gaps roughly 14–17 px. |
| `layout.content.gap` | 16 px | UI-246 working and supporting columns separated by about 15 px. |
| `space.scale` | 4 / 8 / 12 / 16 / 24 / 32 px | Proposed regularization of visually repeated compact/panel/section spacing in UI-246/UI-181/UI-037. No exact 4 px source grid is proven. |
| `card.padding` | 16 px | UI-246 panels commonly inset headings/content by roughly 14–20 px. |
| `card.kpi.height` | 88 px | UI-246 KPI cards approximately y=136–224. Widths depend on available space/count. |
| `page.icon-tile.size` | 56 px | UI-246 title tile roughly x=301–357/y=62–118. |
| `navigation.item.height` | 34 px regular | UI-246 primary rows approximately 33–35 px. Some screenshots are denser; later target-size checks may require more padding. |
| `navigation.child.height` | 31 px | UI-246 child rows approximately 30–32 px. |
| `button.height.regular` | 36 px | UI-246 panel Create Role approximately 34 px; page Create Configuration approximately 42 px. 36 is an explicit normalization, not an identical measured height. |
| `button.height.page-primary` | 42 px | UI-246 upper-right Create Configuration spans roughly y=74–116. |
| `button.height.compact` | 28 px | UI-037 table/form actions approximately 28–33 px; UI-181 toolbar approximately 32 px. Review the chosen compact value. |
| `control.height.regular` | 36 px | UI-246 filters approximately 38 px, UI-181 selects approximately 33 px. 36 is a proposed common value. |
| `control.height.compact` | 28 px | UI-037 first text input spans roughly y=325–350 (~25 px). 28 is a proposal for a separate density. |
| `grid.header.height` | 36 px | UI-246 header approximately y=565–601; UI-181 header approximately 40 px. |
| `grid.row.height.regular` | 40 px | UI-246 six visible rows ~41–43 px each; UI-181 user rows ~39–40 px. |
| `grid.row.height.compact` | 28 px | UI-037 template rows approximately 24 px. 28 is proposed, not the observed compact row. |
| `badge.height` | 22 px regular | UI-246 status/category pills roughly 20–22 px; UI-037 pills smaller. |
| `icon.size.navigation` | 20 px | UI-246 outline glyphs roughly 18–22 px. Exact library/viewBox/padding unknown. |
| `icon.size.control` | 16–18 px | UI-246 toolbar/row actions; keep consistent within each control size. |
| `icon.stroke` | about 1.5–2 px | Thin outline appearance in UI-246/UI-181; actual source stroke width unknown. |
| `layout.supporting-column` | about one-third of working width | UI-246 lower main panel x~291–1181 versus support x~1197–1670; prefer flexible proportions over fixed panel widths. |

## Borders, corners, shadows and missing states

| Proposed role | Provisional recommendation | Evidence / uncertainty |
| --- | --- | --- |
| Panel/control border width | 1 px | Thin visible edges in UI-246/UI-181/UI-037; antialiasing can spread the edge across pixels. |
| Control radius | 4–6 px | UI-037 compact inputs and UI-181 regular filters. Exact curve is unverified. |
| Button radius | 6 px | UI-246 rectangular actions with rounded corners; approximate. |
| Panel radius | 10 px | UI-246 large working/configuration panels look roughly 8–12 px; UI-181 panels somewhat tighter. |
| Status badge radius | Pill / half height | UI-181 status chips and UI-246 category/status badges. |
| Panel shadow | Low elevation, short downward shadow; exact declaration **unset** | UI-246 configuration/working panels show a faint lower lavender shadow. Blur, spread, opacity and shadow color cannot be uniquely recovered from raster data. Do not copy the older implementation's box-shadow as evidence. |
| Hover / pressed | **Unset pending design review** | A static screenshot does not identify hover/pressed state. Do not invent state hex values and call them extracted. |
| Focus ring | P: use sampled primary on pale surfaces; measured white candidate on navy, subject to contrast testing | Accessibility proposal, not a screenshot observation. Ring width/offset need explicit review and rendered tests. |
| Disabled / loading / error interaction | **Unset pending requirements** | Gray can mean Inactive record, not a disabled control. Loading and validation behavior are not established. |
| Mobile / collapsed sidebar dimensions | **Unset pending dedicated references or approved responsive proposal** | UI-244 has a Collapse control, but no dedicated collapsed-state/mobile baseline was established in this review. |
| Modal overlay / toast / drawer elevation | **Unset pending readable dedicated references** | Composite overlays and split-detail panels do not define a complete overlay token system. |

## Recommended semantic mapping and review boundary

The proposed canonical shell maps `page` to sampled lavender, `sidebar` to sampled navy, `header` to the actual UI-246 header sample, `card` to near-white, and primary actions/selected navigation to sampled purple. Keep category colors separate from semantic statuses. Shared controls should consume semantic aliases; Tailwind may reference those aliases later, but its stock colors should not replace them.

Preserve the measured alternatives in this document. Settle the inconsistencies in [DESIGN_ANALYSIS.md](DESIGN_ANALYSIS.md) before converting candidates into a production CSS contract. Unknown tokens deliberately remain unset rather than receiving invented values. Once implementation is authorized, compare the rendered regions against UI-246 at its original dimensions, document normalized differences, and verify contrast, focus, target size and responsive behavior independently. Source-derived values alone do not prove visual fidelity or accessibility.

## Phase 3 component realization

The component library consumes the existing centralized CSS palette and geometry. `--iam-error-text` is a provisional semantic alias of `--iam-text-secondary`; it does not introduce another sampled RGB. Error panels use the existing UI-181 danger tint, UI-007 danger accent and UI-246 navy text for readable feedback; danger buttons also retain navy text in dark mode. Status meaning/interaction normalization is still provisional. Regular fields use the existing 36px height and 6px radius; native date/select/file chrome varies by platform. See [Phase 3 APIs and verification](../PHASE_3_COMPONENTS.md) for the reference mapping, interaction limits and results. No additional Tailwind palette was introduced.

## Phase 4 interaction realization

Toasts, confirmation/message dialogs, notification panels, progress and wizard navigation reuse the existing surface, semantic tint, primary, text, border, radius and spacing variables. No new RGB palette is introduced. UI-244 supplies wizard structure/progress evidence only; its blue primary is excluded from the purple administration theme. Fixed toast position/animation, modal width, focus/keyboard behavior and mobile step stacking are provisional choices because static images do not establish those interactions. See [Phase 4 API and verification](../PHASE_4_FEEDBACK.md) for dimensions, limitations and source-reference comparisons.

## Phase 5 grid mapping

The Community grid maps existing grid-header/row/text/border/control/primary variables through AG Grid's Theming API, with identical odd/even row fills. `--iam-grid-selected: #EDE6FD` realizes the already-measured UI-181 selected-row sample (see Grid and form tokens above); its dark mapping to primary-soft remains provisional. Checkbox interaction colors reuse existing text/control/primary/on-primary variables. Row/header heights, popup geometry and mobile scrolling are normalized/provisional; source images do not prove CSS declarations or keyboard behavior. See [Phase 5 grid documentation](../PHASE_5_GRID.md) for source comparisons and verification. No new generic color palette was introduced.

## Phase 6 composition

Dashboard widgets, trend content, listing summaries, page templates and the integrated catalog reuse the existing palette and spacing/radius/shadow tokens. No new sampled color or Tailwind palette is introduced. Simple chart bars use the existing primary token; category labels and a data table communicate values without relying on color. Numbered pagination uses the existing primary/on-primary current-page treatment, supported by UI-246/UI-181/UI-006. Dashboard three-column support layouts, mock preview controls, generic forms and responsive compositions are normalized, provisional geometry. See the [actual capture/difference review](PHASE_6_COMPARISON.md); the results do not establish pixel-perfect equivalence.
