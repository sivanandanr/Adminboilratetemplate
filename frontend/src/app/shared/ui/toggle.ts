import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { SmartValueAccessor } from './value-accessor';
import { SmartFormField } from './form-field';

@Component({ selector: 'smart-toggle', imports: [SmartFormField], hostDirectives: [{ directive: SmartValueAccessor, inputs: ['id', 'label', 'hint', 'required', 'disabled', 'readonly', 'errors'] }], template: `
  <smart-form-field [forId]="field.id()" [label]="field.label()" [required]="field.required()" [hint]="field.hint()" [errors]="field.messages()">
    <button type="button" role="switch" [id]="field.id()" [disabled]="field.isDisabled() || pending()" [attr.aria-checked]="!!field.value()" [attr.aria-readonly]="field.readonly()" [attr.aria-describedby]="field.describedBy()" [attr.aria-invalid]="field.invalid()" [attr.aria-busy]="pending()" (click)="toggle()" (blur)="field.blur()"><span class="track" aria-hidden="true"><span class="thumb"></span></span>{{ field.value() ? onLabel() : offLabel() }}</button>
    @if (failure()) { <p role="alert">{{ failure() }}</p> }
  </smart-form-field>`, styles: `button { display:flex; align-items:center; gap:8px; min-height:var(--iam-control-height); background:transparent; border:0; color:var(--iam-text); padding:0; }.track { width:36px; height:20px; border-radius:20px; border:1px solid var(--iam-control-border); background:var(--iam-neutral-fill); padding:2px; }.thumb { display:block; width:14px; height:14px; border-radius:50%; background:var(--iam-sidebar); }[aria-checked='true'] .track { background:var(--iam-primary); border-color:var(--iam-primary); }[aria-checked='true'] .thumb { background:var(--iam-on-primary); transform:translateX(15px); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartToggle {
  private destroyed = false;
  constructor() { inject(DestroyRef).onDestroy(() => this.destroyed = true); }
  readonly field = inject<SmartValueAccessor<boolean>>(SmartValueAccessor);
  readonly onLabel = input('Yes'); readonly offLabel = input('No');
  readonly confirmChange = input<((next: boolean) => boolean | Promise<boolean>) | null>(null);
  readonly pending = signal(false); readonly failure = signal('');
  async toggle(): Promise<void> {
    if (this.field.isDisabled() || this.field.readonly() || this.pending()) return;
    const revision = this.field.revision(); const next = !this.field.value();
    this.pending.set(true); this.failure.set('');
    try { if ((await (this.confirmChange()?.(next) ?? true)) && !this.destroyed && this.field.revision() === revision) this.field.commit(next); }
    catch { this.failure.set('The change could not be confirmed. Try again.'); }
    finally { this.pending.set(false); this.field.blur(); }
  }
}
