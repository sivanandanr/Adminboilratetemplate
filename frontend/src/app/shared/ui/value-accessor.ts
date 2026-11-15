import { Directive, DoCheck, Injector, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

let nextId = 0;
/** Composed by form controls. Model writes never emit a user change. */
@Directive({ selector: '[smartValueAccessor]', providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SmartValueAccessor), multi: true }] })
export class SmartValueAccessor<T = unknown> implements ControlValueAccessor, DoCheck {
  readonly id = input(`smart-control-${++nextId}`);
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly errors = input<readonly string[]>([]);
  readonly value = signal<T | null>(null);
  readonly revision = signal(0);
  private readonly formDisabled = signal(false);
  private readonly validation = signal<readonly string[]>([]);
  private readonly injector = inject(Injector);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly messages = computed(() => [...this.errors(), ...this.validation()]);
  readonly invalid = computed(() => this.messages().length > 0);
  readonly describedBy = computed(() => [this.hint() ? `${this.id()}-hint` : '', this.invalid() ? `${this.id()}-error` : ''].filter(Boolean).join(' ') || null);
  private change: (value: T | null) => void = () => undefined;
  private touched: () => void = () => undefined;
  writeValue(value: T | null): void { this.revision.update(value => value + 1); this.value.set(value); }
  registerOnChange(fn: (value: T | null) => void): void { this.change = fn; }
  registerOnTouched(fn: () => void): void { this.touched = fn; }
  setDisabledState(disabled: boolean): void { this.formDisabled.set(disabled); }
  commit(value: T | null): void { if (this.isDisabled() || this.readonly()) return; this.revision.update(value => value + 1); this.value.set(value); this.change(value); }
  blur(): void { this.touched(); }
  ngDoCheck(): void {
    const control = this.injector.get(NgControl, null, { self: true })?.control;
    const errors = control?.invalid && (control.touched || control.dirty) ? control.errors : null;
    const messages = errors ? Object.keys(errors).map((key) => ({ required: 'This field is required.', email: 'Enter a valid email address.', min: 'The value is below the minimum.', max: 'The value exceeds the maximum.', minlength: 'The value is too short.', maxlength: 'The value is too long.', pattern: 'Enter a valid value.', dateRange: 'End date must follow start date.' })[key] ?? 'Enter a valid value.') : [];
    if (messages.join('|') !== this.validation().join('|')) this.validation.set(messages);
  }
}
