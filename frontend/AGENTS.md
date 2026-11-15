
## SmartIAM Screenshot-Driven Frontend Design

### Visual reference
Approved SmartIAM screenshots are the authoritative
visual baseline.

Codex must inspect screenshots in:
docs/design/screenshots/

### Mandatory visual alignment
Match:
- Main page and content background colors
- Sidebar and header background colors
- Card and panel backgrounds
- Typography, text colors, and font weights
- Buttons, sizes, variants, and positions
- Input controls, labels, and validation styling
- Grid headers, rows, filters, and pagination
- Icons, active menu states, and navigation styling
- Spacing, alignment, borders, shadows, and radius
- Dialog, wizard, drawer, and toast appearance

### Design system
Extract verified values from screenshots into
centralized CSS design tokens.

Do not invent colors and claim screenshot fidelity.
Document missing references and provisional decisions.

### Architecture
- Angular 20 standalone components
- Zoneless change detection
- Signals and OnPush
- Typed Reactive Forms
- Tailwind CSS v4
- Custom reusable SmartIAM UI components
- AG Grid Community for data grids
- Lucide Angular icons
- Feature-based architecture

### Quality gates
- Functional tests
- Responsive testing
- Accessibility checks
- Playwright visual comparison
- Build and lint validation
- Documented design differences

Never independently redesign approved screens.
