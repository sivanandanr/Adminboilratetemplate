import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ProgressService, ProgressStatus, RouteProgress } from '../../core/feedback/progress.service';
import { Button } from '../button';
@Component({ selector: 'smart-spinner', template: `<span class="spinner" aria-hidden="true"></span><span class="sr-only" role="status">{{ label() }}</span>`, styles: `:host { display:inline-flex; }.spinner { width:20px; height:20px; border:3px solid var(--iam-control-border); border-top-color:var(--iam-accent); border-radius:50%; animation:spin .8s linear infinite; }@keyframes spin { to { transform:rotate(360deg); } }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartSpinner {
    readonly label = input('Loading');
}
@Component({ selector: 'smart-progress-bar', imports: [Button], template: `<div class="progress-copy"><span>{{ label() }}</span><span>{{ status() === 'running' ? text() : status() }} @if (value() !== null) { {{ value() }}% }</span></div><div class="track" role="progressbar" [attr.aria-label]="label()" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="value()" [attr.aria-valuetext]="text() || status()"><span [class.indeterminate]="value() === null && status() === 'running'" [style.width.%]="value() ?? (status() === 'running' ? 35 : 0)"></span></div>@if (cancellable() && status() === 'running') { <button iamButton type="button" (click)="cancelled.emit()">Cancel operation</button> }`, styles: `.progress-copy { display:flex; justify-content:space-between; gap:12px; margin-bottom:4px; flex-wrap:wrap; }.track { height:10px; background:var(--iam-primary-soft); border:1px solid var(--iam-control-border); border-radius:var(--iam-radius-md); overflow:hidden; }.track>span { display:block; height:100%; background:var(--iam-accent); }.indeterminate { animation:progress-slide 1.5s linear infinite; }@keyframes progress-slide { from { transform:translateX(-100%); }to { transform:translateX(300%); } }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartProgressBar {
    readonly label = input.required<string>();
    readonly percentage = input<number | null>(null);
    readonly text = input('');
    readonly status = input<ProgressStatus>('running');
    readonly cancellable = input(false);
    readonly cancelled = output<void>();
    readonly value = computed(() => { const value = this.percentage(); return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null; });
}
@Component({ selector: 'smart-operation-progress', imports: [SmartProgressBar, Button], template: `@for (item of progress.items(); track item.id) { <section class="panel operation"><smart-progress-bar [label]="item.label" [text]="item.text" [percentage]="item.percentage" [status]="item.status" [cancellable]="!!item.cancel" (cancelled)="progress.cancel(item.id)" />@if(item.status !== 'running') { <p role="status">{{ item.label }}: {{ item.status }}</p><button iamButton type="button" (click)="progress.dismiss(item.id)">Dismiss operation</button> }</section> }`, styles: `.operation { padding:16px; margin:8px 0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartOperationProgress {
    readonly progress = inject(ProgressService);
}
@Component({ selector: 'smart-route-progress', imports: [SmartProgressBar], template: `@if(route.loading()) { <div class="route-progress"><smart-progress-bar label="Loading page" /></div> }`, styles: `.route-progress { position:fixed; top:0; left:0; right:0; z-index:90; }.route-progress ::ng-deep .progress-copy { position:absolute; width:1px; height:1px; overflow:hidden; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartRouteProgress {
    readonly route = inject(RouteProgress);
}
