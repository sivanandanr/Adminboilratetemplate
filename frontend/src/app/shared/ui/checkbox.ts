import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-checkbox', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `<smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><div class="smart-choice"><input type="checkbox" [id]="field.id()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-readonly]="field.readonly()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" [checked]="field.value() ?? false" (click)="click($event)" (blur)="field.blur()" /><span>{{ field.value() ? checkedLabel() : uncheckedLabel() }}</span></div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartCheckbox {
  readonly field = inject<SmartValueAccessor<boolean>>(SmartValueAccessor);
  readonly checkedLabel = input('Selected');
  readonly uncheckedLabel = input('Not selected');
  click(event: Event): void { if (this.field.readonly()) event.preventDefault(); else this.field.commit((event.target as HTMLInputElement).checked); }
}
