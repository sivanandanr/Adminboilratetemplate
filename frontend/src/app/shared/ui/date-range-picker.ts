import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
export interface SmartDateRange { readonly start: string; readonly end: string; }
/** Add to the consuming FormControl; incomplete ranges and reversed dates are invalid. */
export const smartDateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
 const value = control.value as SmartDateRange | null;
 return value && (!value.start || !value.end || value.end < value.start) ? { dateRange: true } : null;
};
@Component({ selector: 'smart-date-range-picker', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `
 <smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><div class="smart-input-row">
 <input class="smart-input" type="date" [id]="field.id()" [attr.aria-label]="field.label() + ' start'" [value]="field.value()?.start ?? ''" [min]="min()" [max]="max()" [required]="field.required()" [disabled]="field.isDisabled()" [readonly]="field.readonly()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (input)="update('start', $event)" (blur)="field.blur()" />
 <span aria-hidden="true">–</span><input class="smart-input" type="date" [attr.aria-label]="field.label() + ' end'" [value]="field.value()?.end ?? ''" [min]="field.value()?.start || min()" [max]="max()" [required]="field.required()" [disabled]="field.isDisabled()" [readonly]="field.readonly()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (input)="update('end', $event)" (blur)="field.blur()" /></div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDateRangePicker {
 readonly field = inject<SmartValueAccessor<SmartDateRange>>(SmartValueAccessor);
 readonly min = input(''); readonly max = input('');
 update(part: 'start' | 'end', event: Event): void { const next = { start: '', end: '', ...this.field.value(), [part]: (event.target as HTMLInputElement).value }; this.field.commit(!next.start && !next.end ? null : next); }
}
