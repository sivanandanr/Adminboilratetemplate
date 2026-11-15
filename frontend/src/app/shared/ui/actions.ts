import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, output, signal } from '@angular/core';
import { Button, ButtonEmphasis, ButtonGroupState, ButtonVariant } from '../button';
import { ConfirmationKind, ConfirmOptions, DialogService } from '../../core/feedback/dialog.service';
import type { DirtyFormTracker } from '../../core/feedback/dirty-forms.service';
import type { SmartForm } from './forms';
import { Icon, IconName } from '../icon';
export interface SmartAction { readonly id: string; readonly label: string; readonly icon?: IconName; readonly disabled?: boolean; readonly disabledReason?: string; }
@Component({ selector: 'smart-button', imports: [Button, Icon], template: `<button iamButton [type]="type()" [variant]="variant()" [size]="size()" [disabled]="disabled()" [loading]="loading() || confirming()" [emphasis]="emphasis()" [disabledReason]="disabledReason()" [tooltip]="tooltip()" [attr.aria-label]="label()" (click)="activate($event)"><span class="button-content" [class.busy]="loading() || confirming()"><iam-icon [name]="icon() ?? 'ArrowRight'" />@if (!iconOnly()) { {{ label() }} }</span>@if (loading() || confirming()) { <iam-icon class="button-spinner" name="LoaderCircle" /> }@if (iconAfter()) { <iam-icon [name]="iconAfter()!" /> }</button>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartButton {
 readonly label = input.required<string>(); readonly type = input<'button' | 'submit' | 'reset'>('button');
 readonly variant = input<ButtonVariant>('secondary'); readonly emphasis = input<ButtonEmphasis>('auto'); readonly size = input<'small' | 'medium' | 'large'>('medium');
 readonly disabledReason = input('');
 readonly action = input<ConfirmationKind | null>(null);
 readonly confirmation = input<ConfirmOptions | null>(null);
 readonly confirming = signal(false);
 private readonly dialogs = inject(DialogService);
 private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
 private destroyed = false;
 constructor() { inject(DestroyRef).onDestroy(() => this.destroyed = true); }
 async activate(event?: Event): Promise<void> {
  if (this.disabled() || this.loading() || this.confirming()) return;
  const kind = this.action();
  if (this.confirmation() || kind) {
   event?.preventDefault();
   this.confirming.set(true);
   try { const result = await this.dialogs.confirm(this.confirmation() ?? { kind: kind ?? 'confirm', title: this.label() + '?', message: 'Confirm this action to continue.', primaryLabel: this.label() }); if (!result.confirmed) return; }
   finally { this.confirming.set(false); }
  }
  if (this.destroyed || this.disabled() || this.loading()) return;
  this.pressed.emit();
  if (event?.defaultPrevented && (this.confirmation() || kind)) {
   const button = this.element.nativeElement.querySelector('button');
   if (button?.type === 'submit') button.form?.requestSubmit(button);
   else if (button?.type === 'reset') button.form?.reset();
  }
 }
 readonly icon = input<IconName | null>(null); readonly iconAfter = input<IconName | null>(null); readonly iconOnly = input(false); readonly tooltip = input(''); readonly disabled = input(false); readonly loading = input(false); readonly pressed = output<void>();
}
@Component({ selector: 'smart-button-group', providers: [ButtonGroupState], template: `<div role="group" [attr.aria-label]="label()" class="smart-actions"><ng-content /></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartButtonGroup { readonly label = input.required<string>(); }
@Component({ selector: 'smart-action-toolbar', host: { '[class.form-footer]': 'placement() === "form"' }, imports: [Icon, SmartButton], providers: [ButtonGroupState], template: `<div class="smart-actions action-toolbar" role="group" [attr.aria-label]="label()" [attr.data-placement]="placement()"><div class="action-status"><ng-content select="[actionStatus]" />@if (isDirty()) { <span class="unsaved-pill"><iam-icon name="Pencil" [size]="14" />Unsaved changes</span> }</div><div class="action-buttons"><ng-content /><ng-content select="[cancelAction]" />@if (form()) { <smart-button [label]="closeLabel()" icon="X" (pressed)="requestClose()" /> }<ng-content select="[primaryAction]" /></div></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartActionToolbar { readonly dirty = input(false); readonly form = input<DirtyFormTracker | SmartForm | null>(null); readonly isDirty = computed(() => this.dirty() || !!this.form()?.isDirty()); readonly closeLabel = computed(() => this.isDirty() ? 'Cancel' : 'Close'); readonly closed = output<void>(); async requestClose(): Promise<void> { if (await (this.form()?.requestLeave() ?? Promise.resolve(true))) this.closed.emit(); } readonly label = input('Page actions'); readonly placement = input<'page' | 'form' | 'grid' | 'row' | 'dialog' | 'wizard'>('page'); }
@Component({ selector: 'smart-split-button', imports: [Button, Icon], template: `<div class="split" (focusout)="focusout($event)"><div class="smart-input-row"><button iamButton type="button" variant="primary" [disabled]="disabled()" [loading]="loading()" [disabledReason]="disabledReason()" (click)="selected.emit(primaryId())"><span class="button-content"><iam-icon [name]="icon()" />{{ label() }}</span></button><button #trigger iamButton type="button" variant="secondary" [disabled]="disabled() || loading()" [attr.aria-expanded]="open()" [attr.aria-label]="label() + ' more actions'" (click)="open.set(!open())" (keydown.arrowdown)="open.set(true)"><iam-icon name="ChevronDown" /></button></div>@if (open()) { <div class="smart-popover" role="group" [attr.aria-label]="label() + ' actions'" (keydown.escape)="open.set(false); trigger.focus()">@for (action of actions(); track action.id) { <button iamButton type="button" variant="ghost" [disabled]="disabled() || loading() || (action.disabled ?? false)" [disabledReason]="action.disabledReason ?? disabledReason()" (click)="selected.emit(action.id); open.set(false); trigger.focus()"><iam-icon [name]="action.icon ?? 'ArrowRight'" />{{ action.label }}</button> }</div> }</div>`, styles: `.split { position:relative; }.smart-input-row { gap:1px; }.smart-popover { min-width:180px; }.smart-popover button { width:100%; justify-content:flex-start; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartSplitButton {
 readonly icon = input<IconName>('ArrowRight'); readonly disabledReason = input('');
 readonly label = input.required<string>(); readonly primaryId = input('primary'); readonly actions = input<readonly SmartAction[]>([]); readonly disabled = input(false); readonly loading = input(false); readonly selected = output<string>(); readonly open = signal(false);
 focusout(event: FocusEvent): void { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) this.open.set(false); }
}
