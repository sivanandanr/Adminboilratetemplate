import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { Button } from '../button';
import { Icon, IconName } from '../icon';
export interface SmartAction { readonly id: string; readonly label: string; readonly icon?: IconName; readonly disabled?: boolean; }
@Component({ selector: 'smart-button', imports: [Button, Icon], template: `<button iamButton [type]="type()" [variant]="variant()" [size]="size()" [disabled]="disabled()" [loading]="loading()" [tooltip]="tooltip()" [attr.aria-label]="iconOnly() ? label() : null" (click)="pressed.emit()">@if (loading()) { <iam-icon name="LoaderCircle" /> }@else if (icon()) { <iam-icon [name]="icon()!" /> }@if (!iconOnly()) { {{ label() }} }@if (iconAfter()) { <iam-icon [name]="iconAfter()!" /> }</button>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartButton {
 readonly label = input.required<string>(); readonly type = input<'button' | 'submit' | 'reset'>('button');
 readonly variant = input<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'>('secondary'); readonly size = input<'small' | 'medium' | 'large'>('medium');
 readonly icon = input<IconName | null>(null); readonly iconAfter = input<IconName | null>(null); readonly iconOnly = input(false); readonly tooltip = input(''); readonly disabled = input(false); readonly loading = input(false); readonly pressed = output<void>();
}
@Component({ selector: 'smart-button-group', template: `<div role="group" [attr.aria-label]="label()" class="smart-actions"><ng-content /></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartButtonGroup { readonly label = input.required<string>(); }
@Component({ selector: 'smart-action-toolbar', template: `<div class="smart-actions" role="group" [attr.aria-label]="label()" [attr.data-placement]="placement()"><ng-content /></div>`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartActionToolbar { readonly label = input('Page actions'); readonly placement = input<'page' | 'form' | 'grid' | 'row' | 'dialog' | 'wizard'>('page'); }
@Component({ selector: 'smart-split-button', imports: [Button, Icon], template: `<div class="split" (focusout)="focusout($event)"><div class="smart-input-row"><button iamButton type="button" variant="primary" [disabled]="disabled()" [loading]="loading()" (click)="selected.emit(primaryId())">{{ label() }}</button><button #trigger iamButton type="button" variant="primary" [disabled]="disabled() || loading()" [attr.aria-expanded]="open()" [attr.aria-label]="label() + ' more actions'" (click)="open.set(!open())" (keydown.arrowdown)="open.set(true)"><iam-icon name="ChevronDown" /></button></div>@if (open()) { <div class="smart-popover" role="group" [attr.aria-label]="label() + ' actions'" (keydown.escape)="open.set(false); trigger.focus()">@for (action of actions(); track action.id) { <button iamButton type="button" variant="ghost" [disabled]="disabled() || loading() || (action.disabled ?? false)" (click)="selected.emit(action.id); open.set(false); trigger.focus()">{{ action.label }}</button> }</div> }</div>`, styles: `.split { position:relative; }.smart-input-row { gap:1px; }.smart-popover { min-width:180px; }.smart-popover button { width:100%; justify-content:flex-start; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartSplitButton {
 readonly label = input.required<string>(); readonly primaryId = input('primary'); readonly actions = input<readonly SmartAction[]>([]); readonly disabled = input(false); readonly loading = input(false); readonly selected = output<string>(); readonly open = signal(false);
 focusout(event: FocusEvent): void { if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) this.open.set(false); }
}
