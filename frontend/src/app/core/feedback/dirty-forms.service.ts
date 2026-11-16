import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, Signal, computed, inject, signal } from '@angular/core';
import { AbstractControl, ValueChangeEvent } from '@angular/forms';
import { DialogService } from './dialog.service';

/** One lifecycle per form; no form values are stored in the global registry or browser storage. */
export class DirtyFormTracker {
 private readonly dirty = signal(false);
 readonly isDirty = this.dirty.asReadonly();
 readonly closeLabel = computed(() => this.isDirty() ? 'Cancel' : 'Close');
 private revision = 0;
 private active = true;
 private readonly subscription;
 constructor(readonly control: AbstractControl, private readonly changed: () => void, private readonly leave: () => Promise<boolean>, private readonly unregister: () => void) {
  this.dirty.set(control.dirty);
  this.subscription = control.events.subscribe(event => {
   if (event instanceof ValueChangeEvent) ++this.revision;
   this.dirty.set(control.dirty); this.changed();
  });
 }
 markSaved(): void { if (this.active) this.control.markAsPristine(); }
 /** Failed saves and edits made during a pending save remain protected. */
 async save<T>(work: () => Promise<T>): Promise<T> {
  const revision = this.revision; const result = await work();
  if (this.active && revision === this.revision) this.markSaved();
  return result;
 }
 requestLeave(): Promise<boolean> { return this.isDirty() ? this.leave() : Promise.resolve(true); }
 destroy(): void { if (!this.active) return; this.active = false; this.subscription.unsubscribe(); this.dirty.set(false); this.unregister(); }
}

@Injectable({ providedIn: 'root' })
export class DirtyFormsService {
 private readonly document = inject(DOCUMENT);
 private readonly dialogs = inject(DialogService);
 private readonly forms = signal<readonly DirtyFormTracker[]>([]);
 readonly isDirty: Signal<boolean> = computed(() => this.forms().some(form => form.isDirty()));
 private listening = false;
 private pending?: Promise<boolean>;
 private discardId: number | null = null;
 private readonly beforeUnload = (event: BeforeUnloadEvent): void => { if (this.isDirty()) { event.preventDefault(); event.returnValue = ''; } };
 constructor() { inject(DestroyRef).onDestroy(() => this.clear()); }
 track(control: AbstractControl, destroyRef?: DestroyRef): DirtyFormTracker {
  let tracker!: DirtyFormTracker;
  tracker = new DirtyFormTracker(control, () => this.syncListener(), () => this.confirmDiscard([tracker]), () => {
   this.forms.update(forms => forms.filter(item => item !== tracker)); this.syncListener();
  });
  this.forms.update(forms => [...forms, tracker]); this.syncListener();
  destroyRef?.onDestroy(() => tracker.destroy()); return tracker;
 }
 requestLeave(): Promise<boolean> { return this.confirmDiscard(this.forms().filter(form => form.isDirty())); }
 private confirmDiscard(forms: readonly DirtyFormTracker[]): Promise<boolean> {
  if (!forms.some(form => form.isDirty())) return Promise.resolve(true);
  if (!this.pending) {
   const result = this.dialogs.confirm({ kind: 'unsaved', title: 'Discard your changes?', message: 'Your unsaved changes will be lost.', secondaryLabel: 'Keep editing', primaryLabel: 'Discard', okVariant: 'danger' });
   this.discardId = this.dialogs.requests().at(-1)!.id;
   this.pending = result.then(result => result.confirmed).finally(() => { this.pending = undefined; this.discardId = null; });
  }
  return this.pending;
 }
 /** Security-driven logout/identity changes bypass browser leave warnings. Never saves form data. */
 clear(): void { if (this.discardId !== null) this.dialogs.settle(this.discardId, { confirmed: false }); for (const form of this.forms()) form.destroy(); this.syncListener(); }
 private syncListener(): void {
  const target = this.document.defaultView; const needed = this.isDirty();
  if (needed === this.listening || !target) return;
  this.listening = needed;
  if (needed) target.addEventListener('beforeunload', this.beforeUnload);
  else target.removeEventListener('beforeunload', this.beforeUnload);
 }
}
