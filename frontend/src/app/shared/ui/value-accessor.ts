import { SmartForm } from './forms';
import { Directive, DestroyRef, DoCheck, OnInit, Injector, computed, forwardRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormGroupDirective, PristineChangeEvent, TouchedChangeEvent } from '@angular/forms';

let nextId = 0;
/** Composed by form controls. Model writes never emit a user change. */
@Directive({ selector: '[smartValueAccessor]', providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SmartValueAccessor), multi: true }] })
export class SmartValueAccessor<T = unknown> implements ControlValueAccessor, DoCheck, OnInit {
  readonly id = input(`smart-control-${++nextId}`);
  readonly label = input('');
  readonly placeholder = input('');
  readonly hint = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly disabledReason = input('');
  /** Standalone controls retain touch feedback; real forms validate on submit, then change. */
  readonly validationMode = input<'auto' | 'submit' | 'touched'>('auto');
  private readonly formState = inject(SmartForm, { optional: true, skipSelf: true });
  acceptModelWrites = true;
  private readonly parentForm = inject(FormGroupDirective, { optional: true, skipSelf: true });
  readonly readonly = input(false);
  readonly errors = input<readonly string[]>([]);
  readonly value = signal<T | null>(null);
  readonly revision = signal(0);
  private readonly formDisabled = signal(false);
  private readonly validation = signal<readonly string[]>([]);
  private submitted = false;
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  ngOnInit(): void {
    const control = this.injector.get(NgControl, null, { self: true })?.control;
    this.submitted = this.parentForm?.submitted ?? false;
    control?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if ((event instanceof PristineChangeEvent || event instanceof TouchedChangeEvent) && control.pristine && control.untouched) this.submitted = false;
      this.ngDoCheck();
    });
    this.parentForm?.control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.ngDoCheck());
    this.parentForm?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.submitted = true; this.ngDoCheck(); });
  }
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  readonly messages = computed(() => [...this.errors(), ...this.validation()]);
  readonly invalid = computed(() => this.messages().length > 0);
  readonly describedBy = computed(() => [this.hint() ? `${this.id()}-hint` : '', this.invalid() ? `${this.id()}-error` : '', this.isDisabled() && this.disabledReason() ? `${this.id()}-disabled` : ''].filter(Boolean).join(' ') || null);
  private change: (value: T | null) => void = () => undefined;
  private touched: () => void = () => undefined;
  writeValue(value: T | null): void { this.revision.update(value => value + 1); this.value.set(this.acceptModelWrites ? value : null); }
  registerOnChange(fn: (value: T | null) => void): void { this.change = fn; }
  registerOnTouched(fn: () => void): void { this.touched = fn; }
  setDisabledState(disabled: boolean): void { this.formDisabled.set(disabled); }
  commit(value: T | null): void { if (this.isDisabled() || this.readonly()) return; this.revision.update(value => value + 1); this.value.set(value); this.change(value); }
  initializeDefault(value: T): void {
    if ((this.value() != null && this.value() !== '') || this.isDisabled() || this.readonly()) return;
    const control = this.injector.get(NgControl, null, { self: true })?.control;
    if (control) control.setValue(value); else this.writeValue(value);
  }
  blur(): void { this.touched(); }
  ngDoCheck(): void {
    const control = this.injector.get(NgControl, null, { self: true })?.control;
    const submitMode = this.validationMode() === 'submit' || (this.validationMode() === 'auto' && !!this.formState);
    const show = submitMode && this.parentForm ? this.formState?.validationStarted() ?? this.submitted : control?.touched;
    const errors = !this.isDisabled() && control?.invalid && show ? control.errors : null;
    const messages = errors ? Object.keys(errors).map((key) => ({ required: 'This field is required.', email: 'Enter a valid email address.', min: `Enter a value of at least ${errors['min']?.min}.`, max: `Enter a value no greater than ${errors['max']?.max}.`, minlength: `Enter at least ${errors['minlength']?.requiredLength} characters.`, maxlength: `Enter no more than ${errors['maxlength']?.requiredLength} characters.`, pattern: 'Enter a valid value.', dateRange: 'Enter both dates, with the end on or after the start.', date: 'Enter a valid date.', minDate: `Choose a date on or after ${errors['minDate']?.min}.`, maxDate: `Choose a date on or before ${errors['maxDate']?.max}.` })[key] ?? 'Enter a valid value.') : [];
    if (messages.join('|') !== this.validation().join('|')) this.validation.set(messages);
  }
}
