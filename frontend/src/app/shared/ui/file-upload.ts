import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject, input, signal } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';
import { Button } from '../button';
@Component({ selector: 'smart-file-upload', imports: [SmartFormField, Button], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `
 <smart-form-field [forId]="field.id()" [label]="field.label()" [hint]="field.hint()" [required]="field.required()" [errors]="messages()"><input #picker class="smart-input" type="file" [id]="field.id()" [accept]="accept()" [multiple]="multiple()" [disabled]="field.isDisabled()" [attr.aria-readonly]="field.readonly()" [attr.aria-invalid]="messages().length > 0" [attr.aria-describedby]="messages().length ? field.id() + '-error' : field.describedBy()" (click)="lock($event)" (change)="select($event)" (blur)="field.blur()" />
 <ul>@for (file of field.value() ?? []; track $index) { <li>{{ file.name }} ({{ file.size }} bytes)</li> }</ul>@if (field.value()?.length) { <button iamButton type="button" [disabled]="field.isDisabled() || field.readonly()" (click)="clear()">Clear files</button> }</smart-form-field>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartFileUpload {
 readonly field = inject<SmartValueAccessor<readonly File[]>>(SmartValueAccessor);
 readonly accept = input(''); readonly multiple = input(false); readonly maxBytes = input(10 * 1024 * 1024); readonly maxFiles = input(10);
 private readonly rejection = signal<readonly string[]>([]);
 readonly messages = () => [...this.field.messages(), ...this.rejection()];
 @ViewChild('picker') private picker?: ElementRef<HTMLInputElement>;
 constructor() { effect(() => { if (!this.field.value()?.length && this.picker) this.picker.nativeElement.value = ''; }); }
 lock(event: Event): void { if (this.field.readonly()) event.preventDefault(); }
 select(event: Event): void {
  const element = event.target as HTMLInputElement; const files = Array.from(element.files ?? []);
  if (this.field.readonly() || this.field.isDisabled()) { element.value = ''; return; }
  const accepted = this.accept().split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  const mismatch = files.some(file => accepted.length && !accepted.some(rule => rule.startsWith('.') ? file.name.toLowerCase().endsWith(rule) : rule.endsWith('/*') ? file.type.startsWith(rule.slice(0, -1)) : file.type === rule));
  const errors = files.length > (this.multiple() ? this.maxFiles() : 1) ? ['Too many files selected.'] : files.some(file => file.size > this.maxBytes()) ? ['A file exceeds the size limit.'] : mismatch ? ['A file type is not accepted.'] : [];
  this.rejection.set(errors); if (!errors.length) this.field.commit(files); element.value = ''; this.field.blur();
 }
 clear(): void { this.field.commit([]); this.rejection.set([]); this.field.blur(); }
}
