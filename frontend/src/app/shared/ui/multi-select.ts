import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartAutocomplete, SmartDataProvider, SmartOption } from './autocomplete';
/** Multiple selection uses the same searchable, paged, keyboard-accessible list as autocomplete. */
@Component({ selector: 'smart-multi-select', imports: [SmartAutocomplete], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'placeholder', 'hint', 'required', 'disabled', 'disabledReason', 'validationMode', 'readonly', 'errors'] }], template: `
 <smart-autocomplete [id]="field.id()" [label]="field.label()" [placeholder]="field.placeholder()" [hint]="field.hint()" [required]="field.required()" [disabled]="field.isDisabled()" [disabledReason]="field.disabledReason()" [readonly]="field.readonly()" [errors]="field.messages()" [items]="options()" [provider]="provider()" [selectedLabels]="selectedLabels()" [multiple]="true" [selection]="field.value()" [pageSize]="pageSize()" [minLength]="minLength()" (selectionChanged)="change($event)" (blurred)="field.blur()" />`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartMultiSelect {
 readonly field = inject<SmartValueAccessor<readonly string[]>>(SmartValueAccessor);
 readonly options = input<readonly SmartOption[]>([]);
 /** Retained for API compatibility; results now use accessible listbox paging. */
 readonly size = input(4);
 readonly provider = input<SmartDataProvider<SmartOption> | null>(null);
 readonly pageSize = input(25);
 readonly minLength = input(0);
 readonly selectedLabels = input<Readonly<Record<string, string>>>({});
 change(value: string | readonly string[] | null): void { this.field.commit(typeof value === 'string' ? [value] : value ?? []); }
}
