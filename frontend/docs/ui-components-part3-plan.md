# Part 3 implementation plan

Scope: shared form-field and every form control, per-form dirty tracking and a reusable router guard. Reuse existing fonts, semantic tokens, DialogService and action toolbar. No feature-page migration, new demo route, layout/idle redesign or Part 4 work.

- Centralize submit-then-change feedback through SmartForm for new reactive forms; unmigrated forms and standalone controls retain touch feedback for callback compatibility. Explicit server errors remain visible. Add a disabled reason to the common wrapper/API and use it for radio groups too.
- Reuse autocomplete for searchable/paged multi-select, wildcard browse, chips and keyboard selection. Preserve its options/size/CVA API; native select DOM is replaced by the required combobox pattern.
- Passwords do not echo programmatic values into the input. Date bounds validate model values, not only native pickers; access-date defaulting is explicit and uses the local date.
- Track each registered form through control events, clean up listeners on destruction, clear only after successful save, and protect against edits made during a pending save. A shared registry owns beforeunload only while dirty and coalesces discard confirmations. Expose the tracker to action footers and the reusable route guard. Preserve the existing UnsavedAware guard export for old pages.
- Verify focused component/service/router tests, existing form browser behavior, accessibility/reflow and screenshot changes; run typecheck/build and production auth isolation. Document APIs and remaining page migration scope.
