import { dateErrors, localToday } from './date-validation';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator } from '@angular/forms';
import { ChangeDetectionStrategy, Component, afterNextRender, effect, forwardRef, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-date-picker', imports: [SmartFormField], providers: [{ provide: NG_VALIDATORS, useExisting: forwardRef(() => SmartDatePicker), multi: true }], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `<smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><input class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" type="date" [min]="min()" [max]="max()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="field.commit($any($event.target).value || null)" /></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDatePicker implements Validator {
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  /** Opt in for new access-validity fields; existing dates are never overwritten. */
  readonly accessDate = input(false);
  private validationChanged = () => {};
  constructor() { effect(() => { this.min(); this.max(); this.validationChanged(); }); afterNextRender(() => { if (this.accessDate()) this.field.initializeDefault(localToday()); }); }
  registerOnValidatorChange(fn: () => void): void { this.validationChanged = fn; }
  validate(control: AbstractControl): ValidationErrors | null { return dateErrors(control.value, this.min(), this.max()); }
  readonly min = input('');
  readonly max = input('');
}
