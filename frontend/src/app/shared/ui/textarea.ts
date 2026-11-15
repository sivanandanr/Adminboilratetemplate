import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-textarea', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `<smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><textarea class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" [rows]="rows()" [attr.maxlength]="maxlength()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="field.commit($any($event.target).value)"></textarea></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartTextarea {
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  readonly rows = input(3);
  readonly maxlength = input<number | null>(null);
}
