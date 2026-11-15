import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-multi-select', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `<smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><select class="smart-input" [id]="field.id()"  [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" multiple [size]="size()" [attr.aria-readonly]="field.readonly()" (keydown)="lock($event)" (pointerdown)="lock($event)" (change)="select($event)">@for (option of options(); track option.value) { <option [value]="option.value" [selected]="field.value()?.includes(option.value) ?? false" [disabled]="option.disabled">{{ option.label }}</option> }</select></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartMultiSelect {
  readonly field = inject<SmartValueAccessor<readonly string[]>>(SmartValueAccessor);
  readonly options = input<readonly { value: string; label: string; disabled?: boolean }[]>([]);
  readonly size = input(4);
  lock(event: Event): void { if (this.field.readonly() && (!(event instanceof KeyboardEvent) || !['Tab', 'Escape'].includes(event.key))) event.preventDefault(); }
  select(event: Event): void { const element = event.target as HTMLSelectElement; this.field.commit(Array.from(element.selectedOptions).map(option => option.value)); for (const option of Array.from(element.options)) option.selected = this.field.value()?.includes(option.value) ?? false; }
}
