import { dateErrors, localToday } from './date-validation';
import { ChangeDetectionStrategy, Component, afterNextRender, effect, forwardRef, inject, input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
export interface SmartDateRange { readonly start: string; readonly end: string; }
/** Add to the consuming FormControl; incomplete ranges and reversed dates are invalid. */
export const smartDateRangeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
 const value = control.value as SmartDateRange | null;
 return value && (!value.start || !value.end || value.end < value.start) ? { dateRange: true } : null;
};
@Component({ selector: 'smart-date-range-picker', imports: [SmartFormField], providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => SmartDateRangePicker), multi: true }], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `
 <smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><div class="smart-input-row">
 <input class="smart-input" type="date" [id]="field.id()" [attr.aria-label]="field.label() + ' start'" [value]="field.value()?.start ?? ''" [min]="min()" [max]="max()" [required]="field.required()" [disabled]="field.isDisabled()" [readonly]="field.readonly()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (input)="update('start', $event)" (blur)="field.blur()" />
 <span aria-hidden="true">–</span><input class="smart-input" type="date" [attr.aria-label]="field.label() + ' end'" [value]="field.value()?.end ?? ''" [min]="endMin()" [max]="max()" [required]="field.required()" [disabled]="field.isDisabled()" [readonly]="field.readonly()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (input)="update('end', $event)" (blur)="field.blur()" /></div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDateRangePicker implements Validator {
 readonly field = inject<SmartValueAccessor<SmartDateRange>>(SmartValueAccessor);
 readonly accessDate = input(false);
 private validationChanged = () => {};
 constructor() { effect(() => { this.min(); this.max(); this.validationChanged(); }); afterNextRender(() => { if (this.accessDate()) this.field.initializeDefault({ start: localToday(), end: '' }); }); }
 registerOnValidatorChange(fn: () => void): void { this.validationChanged = fn; }
 validate(control: AbstractControl): ValidationErrors | null { const value = control.value as SmartDateRange | null; return smartDateRangeValidator(control) ?? dateErrors(value?.start, this.min(), this.max()) ?? dateErrors(value?.end, this.min(), this.max()); }
 endMin(): string { const start = this.field.value()?.start ?? ''; return start > this.min() ? start : this.min(); }
 readonly min = input(''); readonly max = input('');
 update(part: 'start' | 'end', event: Event): void { const next = { start: '', end: '', ...this.field.value(), [part]: (event.target as HTMLInputElement).value }; this.field.commit(!next.start && !next.end ? null : next); }
}
