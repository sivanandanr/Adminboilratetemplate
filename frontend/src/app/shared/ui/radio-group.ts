import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFieldError } from './form-field';
@Component({ selector: 'smart-radio-group', imports: [SmartFieldError], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `
 <fieldset class="smart-choices" role="radiogroup" [attr.aria-readonly]="field.readonly()" [disabled]="field.isDisabled()" [attr.aria-describedby]="field.describedBy()" [attr.aria-invalid]="field.invalid()"><legend>{{ field.label() }} @if (field.required()) { <span> (required)</span> }</legend>
 @for (option of options(); track option.value) { <label class="smart-choice"><input type="radio" [name]="field.id()" [value]="option.value" [checked]="field.value() === option.value" [disabled]="option.disabled ?? false" [required]="field.required()" (click)="choose($event, option.value)" (keydown)="lock($event)" (blur)="field.blur()" />{{ option.label }}</label> }
 </fieldset>@if (field.hint()) { <p class="smart-hint" [id]="field.id() + '-hint'">{{ field.hint() }}</p> }<smart-field-error [id]="field.id() + '-error'" [errors]="field.messages()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartRadioGroup {
 readonly field = inject<SmartValueAccessor<string>>(SmartValueAccessor);
 readonly options = input<readonly { value: string; label: string; disabled?: boolean }[]>([]);
 choose(event: Event, value: string): void { if (this.field.readonly()) event.preventDefault(); else this.field.commit(value); }
 lock(event: KeyboardEvent): void { if (this.field.readonly() && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); }
}
