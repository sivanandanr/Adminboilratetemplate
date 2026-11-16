import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-radio-group', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `
 <smart-form-field [forId]="field.id()" [label]="field.label()" [group]="true" [required]="field.required()" [hint]="field.hint()" [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [errors]="field.messages()">
 <div role="radiogroup" [id]="field.id()" [attr.aria-labelledby]="field.id() + '-label'" [attr.aria-readonly]="field.readonly()" [attr.aria-required]="field.required()" [attr.aria-disabled]="field.isDisabled()" [attr.aria-describedby]="field.describedBy()" [attr.aria-invalid]="field.invalid()">
 @for (option of options(); track option.value) { <label class="smart-choice"><input type="radio" [name]="field.id()" [value]="option.value" [checked]="field.value() === option.value" [disabled]="field.isDisabled() || (option.disabled ?? false)" [required]="field.required()" (click)="choose($event, option.value)" (keydown)="lock($event)" (blur)="field.blur()" />{{ option.label }}</label> }
 </div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartRadioGroup {
 readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
 readonly options = input<readonly { value: string; label: string; disabled?: boolean }[]>([]);
 choose(event: Event, value: string): void { if (this.field.readonly()) event.preventDefault(); else this.field.commit(value); }
 lock(event: KeyboardEvent): void { if (this.field.readonly() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); }
}
