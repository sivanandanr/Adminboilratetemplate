import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
import { Button } from '../button';
@Component({ selector: 'smart-password', imports: [SmartFormField, Button], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `<smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><div class="smart-input-row"><input class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" [type]="visible() ? 'text' : 'password'" [autocomplete]="autocomplete()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="field.commit($any($event.target).value)" /><button iamButton type="button" [disabled]="field.isDisabled()" [attr.aria-label]="visible() ? 'Hide password' : 'Show password'" [attr.aria-pressed]="visible()" [attr.aria-controls]="field.id()" (click)="visible.set(!visible())">{{ visible() ? 'Hide' : 'Show' }}</button></div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartPassword {
  constructor() { this.field.acceptModelWrites = false; }
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  readonly visible = signal(false);
  readonly autocomplete = input('new-password');
}
