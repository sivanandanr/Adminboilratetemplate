// Development-only copyable usage examples.
export const componentExamples = [
  {
    "name": "SmartTextbox",
    "code": "<smart-textbox label=\"Name\" [formControl]=\"name\" [required]=\"true\" icon=\"UserRound\" />"
  },
  {
    "name": "SmartPassword",
    "code": "<smart-password label=\"Password\" [formControl]=\"password\" autocomplete=\"current-password\" />"
  },
  {
    "name": "SmartTextarea",
    "code": "<smart-textarea label=\"Description\" [formControl]=\"description\" [rows]=\"4\" />"
  },
  {
    "name": "SmartNumberInput",
    "code": "<smart-number-input label=\"Retries\" [formControl]=\"retries\" [min]=\"1\" [max]=\"10\" />"
  },
  {
    "name": "SmartDropdown",
    "code": "<smart-dropdown label=\"Role\" [formControl]=\"role\" [options]=\"roles\" />"
  },
  {
    "name": "SmartAutocomplete",
    "code": "<smart-autocomplete label=\"Owner\" [formControl]=\"owner\" [provider]=\"users\" [minLength]=\"2\" />"
  },
  {
    "name": "SmartMultiSelect",
    "code": "<smart-multi-select label=\"Roles\" [formControl]=\"selectedRoles\" [options]=\"roles\" />"
  },
  {
    "name": "SmartCheckbox",
    "code": "<smart-checkbox label=\"Accept policy\" [formControl]=\"accepted\" />"
  },
  {
    "name": "SmartRadioGroup",
    "code": "<smart-radio-group label=\"Security\" [formControl]=\"security\" [options]=\"options\" />"
  },
  {
    "name": "SmartToggle",
    "code": "<smart-toggle label=\"Enabled\" [formControl]=\"enabled\" onLabel=\"Enabled\" offLabel=\"Disabled\" [confirmChange]=\"confirm\" />"
  },
  {
    "name": "SmartDatePicker",
    "code": "<smart-date-picker label=\"Effective date\" [formControl]=\"date\" min=\"2026-01-01\" />"
  },
  {
    "name": "SmartDateRangePicker",
    "code": "<smart-date-range-picker label=\"Validity\" [formControl]=\"range\" />\n// new FormControl<SmartDateRange | null>(null, smartDateRangeValidator)"
  },
  {
    "name": "SmartFileUpload",
    "code": "<smart-file-upload label=\"Files\" [formControl]=\"files\" accept=\".txt\" [maxBytes]=\"1024\" />"
  },
  {
    "name": "SmartFormField",
    "code": "<smart-form-field forId=\"code\" label=\"Code\" hint=\"Unique code\"><input id=\"code\" class=\"smart-input\" aria-describedby=\"code-hint\" /></smart-form-field>"
  },
  {
    "name": "SmartFieldError",
    "code": "<smart-field-error id=\"code-error\" [errors]=\"errors\" />"
  },
  {
    "name": "SmartFormSection",
    "code": "<smart-form-section title=\"Configuration\"><smart-textbox label=\"Name\" [formControl]=\"name\" /></smart-form-section>"
  },
  {
    "name": "SmartButton",
    "code": "<smart-button label=\"Save\" variant=\"primary\" icon=\"Plus\" [loading]=\"saving()\" (pressed)=\"save()\" />"
  },
  {
    "name": "SmartButtonGroup",
    "code": "<smart-button-group label=\"Record actions\"><smart-button label=\"Edit\" /><smart-button label=\"Archive\" /></smart-button-group>"
  },
  {
    "name": "SmartSplitButton",
    "code": "<smart-split-button label=\"Create\" [actions]=\"actions\" (selected)=\"run($event)\" />"
  },
  {
    "name": "SmartActionToolbar",
    "code": "<smart-action-toolbar placement=\"form\" label=\"Form actions\"><smart-button label=\"Cancel\" /><smart-button label=\"Save\" variant=\"primary\" /></smart-action-toolbar>"
  },
  {
    "name": "SmartPermission",
    "code": "<smart-button *iamCan=\"'admin.configure'\" label=\"Configure\" (pressed)=\"configure()\" />"
  },
  {
    "name": "SmartCard",
    "code": "<smart-card title=\"Configuration\"><p>Panel contents</p></smart-card>"
  },
  {
    "name": "SmartBadge",
    "code": "<smart-badge tone=\"success\">Active</smart-badge>"
  },
  {
    "name": "SmartStatusIndicator",
    "code": "<smart-status-indicator label=\"Failed\" tone=\"danger\" icon=\"CircleAlert\" />"
  },
  {
    "name": "SmartTabs",
    "code": "<smart-tabs label=\"Details\" [tabs]=\"tabs\" (changed)=\"active.set($event)\"><p>{{ active() }}</p></smart-tabs>"
  },
  {
    "name": "SmartAccordion",
    "code": "<smart-accordion title=\"Advanced options\"><p>Settings</p></smart-accordion>"
  },
  {
    "name": "SmartTooltip",
    "code": "<button iamButton smartTooltip=\"Reload records\">Reload</button>"
  },
  {
    "name": "SmartDivider",
    "code": "<smart-divider />"
  },
  {
    "name": "SmartEmptyState",
    "code": "<smart-empty-state kind=\"empty\" title=\"No records\" actionLabel=\"Create\" (retry)=\"create()\" />"
  },
  {
    "name": "SmartSkeleton",
    "code": "<smart-skeleton width=\"60%\" height=\"24px\" label=\"Loading name\" />"
  },
  {
    "name": "SmartLoadingOverlay",
    "code": "<smart-loading-overlay [loading]=\"loading()\"><p>Content</p></smart-loading-overlay>"
  },
  {
    "name": "SmartPageHeader",
    "code": "<smart-page-header title=\"Administration\" icon=\"Settings\"><smart-button page-actions label=\"Create\" variant=\"primary\" /></smart-page-header>"
  },
  {
    "name": "SmartBreadcrumb",
    "code": "<smart-breadcrumb [items]=\"crumbs\" />"
  },
  {
    "name": "SmartDrawer",
    "code": "<smart-drawer title=\"Details\" [open]=\"open()\" (closed)=\"open.set(false)\"><p>Record details</p></smart-drawer>"
  }
] as const;
