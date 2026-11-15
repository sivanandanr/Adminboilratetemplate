# Phase 6 raster comparisons

Generated with `scripts/compare-phase6-references.ps1`. Originals are never resized. Differences amplify absolute RGB deltas by 3; overlays blend both images equally. Metrics describe raster differences, not acceptance scores. Content, text, source variants and font rendering differ intentionally. Canonical region splits use x=274/y=50 even where a reference has different shell geometry; do not interpret these as isolated component fidelity measurements.

| Screen | Reference | Capture | Difference | Overlay | Mean RGB delta (0-255) | Pixels with channel delta >20 |
| --- | --- | --- | --- | --- | ---: | ---: |
| administration | UI-246 | [capture](captures/administration.png) | [difference](differences/administration-diff.png) | [overlay](differences/administration-overlay.png) | 22.99 | 20.4% |
| employee-dashboard | UI-204 | [capture](captures/employee-dashboard.png) | [difference](differences/employee-dashboard-diff.png) | [overlay](differences/employee-dashboard-overlay.png) | 24.65 | 18.89% |
| manager-dashboard | UI-204 | [capture](captures/manager-dashboard.png) | [difference](differences/manager-dashboard-diff.png) | [overlay](differences/manager-dashboard-overlay.png) | 24.71 | 18.94% |
| iam-dashboard | UI-204 | [capture](captures/iam-dashboard.png) | [difference](differences/iam-dashboard-diff.png) | [overlay](differences/iam-dashboard-overlay.png) | 25.35 | 20.05% |
| system-dashboard | UI-204 | [capture](captures/system-dashboard.png) | [difference](differences/system-dashboard-diff.png) | [overlay](differences/system-dashboard-overlay.png) | 25.05 | 19.46% |
| employees | UI-181 | [capture](captures/employees.png) | [difference](differences/employees-diff.png) | [overlay](differences/employees-overlay.png) | 25.29 | 20.77% |
| employee-details | UI-181 | [capture](captures/employee-details.png) | [difference](differences/employee-details-diff.png) | [overlay](differences/employee-details-overlay.png) | 23.52 | 17.44% |
| employee-create | UI-037 | [capture](captures/employee-create.png) | [difference](differences/employee-create-diff.png) | [overlay](differences/employee-create-overlay.png) | 33.6 | 23.79% |
| employee-edit | UI-037 | [capture](captures/employee-edit.png) | [difference](differences/employee-edit-diff.png) | [overlay](differences/employee-edit-overlay.png) | 33.85 | 23.98% |
| applications | UI-006 | [capture](captures/applications.png) | [difference](differences/applications-diff.png) | [overlay](differences/applications-overlay.png) | 23.84 | 19.1% |
| application-details | UI-152 | [capture](captures/application-details.png) | [difference](differences/application-details-diff.png) | [overlay](differences/application-details-overlay.png) | 22.49 | 17.9% |
| accounts | UI-063 | [capture](captures/accounts.png) | [difference](differences/accounts-diff.png) | [overlay](differences/accounts-overlay.png) | 26.21 | 25.41% |
| account-details | UI-049 | [capture](captures/account-details.png) | [difference](differences/account-details-diff.png) | [overlay](differences/account-details-overlay.png) | 24.16 | 18.3% |
| entitlements | UI-203 | [capture](captures/entitlements.png) | [difference](differences/entitlements-diff.png) | [overlay](differences/entitlements-overlay.png) | 23.14 | 21.64% |
| requests | UI-151 | [capture](captures/requests.png) | [difference](differences/requests-diff.png) | [overlay](differences/requests-overlay.png) | 23.95 | 21.82% |
| request-wizard | UI-007 | [capture](captures/request-wizard.png) | [difference](differences/request-wizard-diff.png) | [overlay](differences/request-wizard-overlay.png) | 46.2 | 27.03% |
| approvals | UI-098 | [capture](captures/approvals.png) | [difference](differences/approvals-diff.png) | [overlay](differences/approvals-overlay.png) | 22.16 | 20.23% |
| approval-details | UI-171 | [capture](captures/approval-details.png) | [difference](differences/approval-details-diff.png) | [overlay](differences/approval-details-overlay.png) | 21.54 | 18.39% |
| workflow-configuration | UI-037 | [capture](captures/workflow-configuration.png) | [difference](differences/workflow-configuration-diff.png) | [overlay](differences/workflow-configuration-overlay.png) | 33.46 | 23.73% |
| provisioning-policy | UI-198 | [capture](captures/provisioning-policy.png) | [difference](differences/provisioning-policy-diff.png) | [overlay](differences/provisioning-policy-overlay.png) | 33.77 | 29.33% |
| audit | UI-117 | [capture](captures/audit.png) | [difference](differences/audit-diff.png) | [overlay](differences/audit-overlay.png) | 34.39 | 23.54% |
