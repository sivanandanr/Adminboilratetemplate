import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DirtyFormsService } from './dirty-forms.service';
export interface UnsavedAware { requestLeave(): Promise<boolean>; }
/** Registered forms share one confirmation. Legacy components retain their requestLeave contract. */
export const DirtyFormGuard: CanDeactivateFn<Partial<UnsavedAware>> = component => {
 const forms = inject(DirtyFormsService);
 return forms.isDirty() ? forms.requestLeave() : component.requestLeave?.() ?? true;
};
/** Compatibility export used by existing record/wizard routes. */
export const UnsavedChangesGuard = DirtyFormGuard;
