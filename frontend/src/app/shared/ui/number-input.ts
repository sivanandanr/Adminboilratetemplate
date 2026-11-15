import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
@Component({ selector: 'smart-number-input', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `<smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="field.messages()"><input class="smart-input" [id]="field.id()" [placeholder]="field.placeholder()" [required]="field.required()" [disabled]="field.isDisabled()" [attr.aria-invalid]="field.invalid()" [attr.aria-describedby]="field.describedBy()" (blur)="field.blur()" type="number" [min]="min()" [max]="max()" [step]="step()" [readonly]="field.readonly()" [value]="field.value() ?? ''" (input)="update($event)" /></smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartNumberInput {
  readonly field = inject<SmartValueAccessor<number>>(SmartValueAccessor);
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  update(event: Event): void { const element = event.target as HTMLInputElement; this.field.commit(Number.isFinite(element.valueAsNumber) ? element.valueAsNumber : null); }
}
