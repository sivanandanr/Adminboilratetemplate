import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-date-picker', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `<smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><input class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" type="date" [min]="min()" [max]="max()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="field.commit($any($event.target).value || null)" /></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDatePicker {
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  readonly min = input('');
  readonly max = input('');
}
