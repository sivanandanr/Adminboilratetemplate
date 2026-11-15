import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ToastItem, ToastService } from '../../core/feedback/toast.service';
import { Button } from '../button';
import { Icon } from '../icon';
@Component({ selector: 'smart-toast', imports: [Button, Icon], template: `<article class="toast" [attr.data-tone]="item().tone" [attr.role]="item().tone === 'error' ? 'alert' : 'status'" (mouseenter)="paused.emit()" (focusin)="paused.emit()"><iam-icon [name]="item().tone === 'error' || item().tone === 'warning' ? 'CircleAlert' : item().tone === 'info' ? 'Bell' : 'CircleCheck'" /><div><strong>{{ item().title }}</strong>@if (item().message) { <p>{{ item().message }}</p> }@if (item().action) { <button iamButton type="button" (click)="action.emit()">{{ item().action?.label }}</button> }</div><button iamButton type="button" [attr.aria-label]="'Dismiss ' + item().title" (click)="dismissed.emit()">×</button></article>`, styles: `.toast { display:flex; align-items:flex-start; gap:12px; padding:16px; background:var(--iam-info-fill); color:var(--iam-sidebar); border:1px solid var(--iam-control-border); border-radius:var(--iam-radius-lg); box-shadow:var(--iam-shadow); overflow-wrap:anywhere; animation:toast-enter .15s ease-out; }.toast>div { flex:1; min-width:0; }p { margin:4px 0 8px; }[data-tone='success'] { background:var(--iam-success-fill); }[data-tone='warning'] { background:var(--iam-warning-fill); }[data-tone='error'] { background:var(--iam-danger-fill); }@keyframes toast-enter { from { transform:translateY(-8px); opacity:0; }to { transform:none; opacity:1; } }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartToast {
    readonly item = input.required<ToastItem>();
    readonly dismissed = output<void>();
    readonly paused = output<void>();
    readonly action = output<void>();
}
@Component({ selector: 'smart-toast-container', imports: [SmartToast, Button], template: `<aside aria-label="Application messages">@if (toasts.items().length > 1) { <button iamButton type="button" (click)="toasts.dismissAll()">Dismiss all messages</button> }@for (item of toasts.items(); track item.id) { <smart-toast [item]="item" (dismissed)="toasts.dismiss(item.id)" (paused)="toasts.pause(item.id)" (action)="toasts.action(item.id)" /> }</aside>`, styles: `aside { position:fixed; top:calc(var(--iam-header-height) + 12px); right:16px; width:min(400px,calc(100vw - 32px)); max-height:calc(100dvh - 80px); overflow:auto; display:grid; gap:8px; z-index:80; }aside:empty { display:none; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartToastContainer {
    readonly toasts = inject(ToastService);
}
