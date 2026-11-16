import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-dropdown', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `<smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><select class="smart-input" [id]="field.id()"  [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" [attr.aria-readonly]="field.readonly()" [value]="field.value() ?? ''" (keydown)="lock($event)" (pointerdown)="lock($event)" (change)="select($event)"><option value="" [selected]="!field.value()">{{ field.placeholder() || 'Select an option' }}</option>@for (option of options(); track option.value) { <option [value]="option.value" [selected]="field.value() === option.value" [disabled]="option.disabled">{{ option.label }}</option> }</select></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartDropdown {
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  readonly options = input<readonly { value: string; label: string; disabled?: boolean }[]>([]);
  lock(event: Event): void { if (this.field.readonly() && (!(event instanceof KeyboardEvent) || !['Tab', 'Escape'].includes(event.key))) event.preventDefault(); }
  select(event: Event): void { const element = event.target as HTMLSelectElement; this.field.commit(element.value || null); element.value = this.field.value() ?? ''; }
}
