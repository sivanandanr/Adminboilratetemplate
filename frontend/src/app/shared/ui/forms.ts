import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, Directive, OnInit, computed, inject, input, signal } from '@angular/core';
import { AbstractControl, FormGroupDirective } from '@angular/forms';
import { DirtyFormsService, DirtyFormTracker } from '../../core/feedback/dirty-forms.service';

/** Use on a reactive form: <form [formGroup]="form" smartForm #state="smartForm">. */
@Directive({ selector: 'form[smartForm]', exportAs: 'smartForm' })
export class SmartForm implements OnInit {
 readonly smartForm = input<AbstractControl | ''>('');
 readonly validationStarted = signal(false);
 private readonly form = inject(FormGroupDirective, { self: true, optional: true });
 private readonly registry = inject(DirtyFormsService);
 private readonly destroyRef = inject(DestroyRef);
 private readonly current = signal<DirtyFormTracker | null>(null);
 readonly isDirty = computed(() => this.current()?.isDirty() ?? false);
 readonly closeLabel = computed(() => this.isDirty() ? 'Cancel' : 'Close');
 ngOnInit(): void {
  const control = this.smartForm() || this.form?.control;
  if (!control) throw new Error('smartForm requires a reactive form or an explicit control.');
  this.current.set(this.registry.track(control, this.destroyRef));
  this.form?.ngSubmit.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.validate());
  control.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { if (control.pristine && control.untouched) this.validationStarted.set(false); });
 }
 /** Supports Save/Next buttons that are outside the native form. */
 validate(): boolean { this.validationStarted.set(true); this.current()?.control.markAllAsTouched(); return this.current()?.control.valid ?? false; }
 markSaved(): void { this.current()?.markSaved(); }
 save<T>(work: () => Promise<T>): Promise<T> { return this.current()!.save(work); }
 requestLeave(): Promise<boolean> { return this.current()?.requestLeave() ?? Promise.resolve(true); }
}
export { DirtyFormsService, DirtyFormTracker } from '../../core/feedback/dirty-forms.service';
