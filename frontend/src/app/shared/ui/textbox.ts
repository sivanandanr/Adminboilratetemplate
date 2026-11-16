import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
import { Icon, IconName } from '../icon';
@Component({ selector: 'smart-textbox', imports: [SmartFormField, Icon], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `<smart-form-field [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><div class="smart-input-row">@if (icon()) { <iam-icon [name]="icon()!" /> }<input class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" [type]="type()" [autocomplete]="autocomplete()" [attr.maxlength]="maxlength()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="field.commit($any($event.target).value)" /></div></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartTextbox {
  readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
  readonly type = input<'text' | 'email' | 'tel' | 'url' | 'search'>('text');
  readonly autocomplete = input('off');
  readonly maxlength = input<number | null>(null);
  readonly icon = input<IconName | null>(null);
}
