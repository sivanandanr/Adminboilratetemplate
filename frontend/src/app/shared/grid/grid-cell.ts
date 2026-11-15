import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { SmartBadge, SmartTone } from '../ui/display';
import { Icon } from '../icon';
import { Button } from '../button';
import { GridAction, GridColumn, GridValue } from './grid.models';
export interface SmartCellParams<T> extends ICellRendererParams<T, GridValue> {
    readonly smartColumn: GridColumn<T>;
}
@Component({ selector: 'smart-grid-cell', imports: [SmartBadge], styles: ':host { display:inline-flex; align-items:center; height:100%; line-height:1.4; max-width:100%; }', template: `@if(status()){<smart-badge [tone]="tone()">{{ text() }}</smart-badge>}@else{<span>{{ text() }}</span>}`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridCellComponent<T> implements ICellRendererAngularComp {
    readonly text = signal('');
    readonly status = signal(false);
    readonly tone = signal<SmartTone>('neutral');
    agInit(params: SmartCellParams<T>): void { this.refresh(params); }
    refresh(params: SmartCellParams<T>): boolean { const value = params.value; this.text.set(value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? '')); this.status.set(params.smartColumn.kind === 'status'); this.tone.set(params.smartColumn.statusTone?.(String(value ?? '')) ?? 'neutral'); return true; }
}
export interface SmartRowActionParams<T> extends ICellRendererParams<T> {
    readonly actions: readonly GridAction<T>[];
    readonly rowLabel: (row: T) => string;
    readonly chosen: (action: string, row: T) => void;
}
let nextMenu = 0;
@Component({ selector: 'smart-grid-row-actions', imports: [Button, Icon], template: `<button #trigger iamButton type="button" variant="ghost" [attr.aria-label]="'Actions for ' + label()" [disabled]="!available().length" aria-haspopup="menu" [attr.aria-expanded]="opened()" [attr.aria-controls]="id" (click)="open()" (keydown.arrowdown)="open()"><iam-icon name="EllipsisVertical" [size]="16" /></button><div #menu [id]="id" popover="auto" role="menu" [attr.aria-label]="label() + ' actions'" (toggle)="toggled($event)" (keydown)="key($event)">@for(action of available();track action.id){<button iamButton type="button" variant="ghost" role="menuitem" (click)="choose(action.id)">{{ action.label }}</button>}</div>`, styles: `button { min-height:30px; }[popover] { position:fixed; inset:auto; margin:0; min-width:180px; padding:4px; color:var(--iam-text); background:var(--iam-surface); border:1px solid var(--iam-control-border); border-radius:var(--iam-radius-md); box-shadow:var(--iam-shadow); }[popover] button { display:flex; width:100%; justify-content:flex-start; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridRowActionsComponent<T> implements ICellRendererAngularComp {
    readonly id = `grid-row-menu-${++nextMenu}`;
    readonly label = signal('record');
    readonly available = signal<readonly GridAction<T>[]>([]);
    readonly opened = signal(false);
    private params?: SmartRowActionParams<T>;
    @ViewChild('menu')
    private menu?: ElementRef<HTMLElement>;
    @ViewChild('trigger')
    private trigger?: ElementRef<HTMLButtonElement>;
    agInit(params: SmartRowActionParams<T>): void { this.refresh(params); }
    refresh(params: SmartRowActionParams<T>): boolean { this.params = params; if (params.data) {
        this.label.set(params.rowLabel(params.data));
        this.available.set(params.actions.filter(action => !action.allowed || action.allowed(params.data!)));
    } return true; }
    open(): void { const menu = this.menu?.nativeElement, trigger = this.trigger?.nativeElement; if (!menu || !trigger || !this.available().length)
        return; menu.showPopover(); this.opened.set(true); const rect = trigger.getBoundingClientRect(); menu.style.left = `${Math.max(8, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8))}px`; menu.style.top = `${Math.max(8, Math.min(rect.bottom + 4, innerHeight - menu.offsetHeight - 8))}px`; menu.querySelector('button')?.focus(); }
    toggled(event: Event): void { this.opened.set((event as ToggleEvent).newState === 'open'); }
    choose(id: string): void { const params = this.params; if (!params?.data || !this.available().some(action => action.id === id))
        return; this.menu?.nativeElement.hidePopover(); this.opened.set(false); this.trigger?.nativeElement.focus(); params.chosen(id, params.data); }
    key(event: KeyboardEvent): void { const menu = this.menu?.nativeElement; if (!menu)
        return; const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('button')); const index = buttons.indexOf(document.activeElement as HTMLButtonElement); if (event.key === 'Escape') {
        event.preventDefault();
        menu.hidePopover();
        this.trigger?.nativeElement.focus();
    }
    else if (event.key === 'Tab')
        menu.hidePopover();
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
    } }
}
