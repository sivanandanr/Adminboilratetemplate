
## Mandatory SmartIAM Screenshot Visual Fidelity Rules

### 1. Design Source of Truth
Approved SmartIAM screenshots are the authoritative
visual references for frontend implementation.

Codex MUST inspect the relevant screenshot before
implementing or modifying any screen.

The implementation MUST preserve:
- Page background colors
- Header and sidebar background colors
- Content area and card background colors
- Primary, secondary, and accent colors
- Text colors and typography
- Button colors, sizes, shapes, and positions
- Grid header, row, border, and selection colors
- Form control backgrounds and borders
- Status indicators and badges
- Icons, sizes, and alignment
- Padding, margins, gaps, and whitespace
- Border radius, shadows, and separators
- Navigation expansion and active menu styles
- Modal, toast, wizard, and drawer appearance

### 2. Color Extraction
Do NOT invent or arbitrarily choose colors.

Extract the design colors from approved screenshots.

Create semantic CSS variables:

--iam-bg-page
--iam-bg-sidebar
--iam-bg-header
--iam-bg-card
--iam-bg-input
--iam-bg-hover
--iam-bg-selected
--iam-color-primary
--iam-color-secondary
--iam-color-accent
--iam-text-primary
--iam-text-secondary
--iam-border-default
--iam-border-focus
--iam-status-success
--iam-status-warning
--iam-status-error
--iam-status-info

Use the extracted values consistently across the app.

When a screenshot color cannot be determined reliably,
mark the value as provisional and document it.

### 3. Layout Fidelity
Match screenshot geometry:
- Sidebar width and collapsed width
- Header height
- Content maximum width
- Page margins and padding
- Grid column alignment
- Button placement
- Card dimensions
- Form field heights
- Dialog dimensions
- Tab positions
- Breadcrumb placement

### 4. Component Consistency
All reusable components MUST use centralized
SmartIAM design tokens.

Do not hardcode arbitrary colors, spacing, or
component dimensions inside feature pages.

Do not use default AG Grid styling without adapting
it to the approved SmartIAM design.

### 5. Screenshot Comparison
For each screen:

1. Load the approved reference screenshot.
2. Implement the Angular screen.
3. Run the application.
4. Capture a Playwright screenshot at the same viewport.
5. Compare the reference and implementation.
6. Check colors, spacing, layout, typography, and icons.
7. Correct material visual differences.
8. Repeat until the screen meets visual acceptance.

Use image-diff tooling for repeatable comparisons.

### 6. Responsive Behavior
Preserve the approved desktop appearance.

For tablet and mobile:
- Adapt navigation and content responsively.
- Do not arbitrarily redesign the visual language.
- Preserve colors, typography, and component styles.
- Avoid horizontal overflow except within designated
  data-grid containers.

### 7. Dark Mode
If an approved dark-mode screenshot exists, use it
as the reference.

Do not invent a dark palette and claim it matches
the approved design.

### 8. Definition of Done
A screen is NOT complete unless:
- Functional tests pass.
- Accessibility checks pass.
- Responsive tests pass.
- Screenshot comparison is completed.
- Visual differences are documented and resolved.
- Design tokens are reused correctly.
- No unauthorized design changes remain.
