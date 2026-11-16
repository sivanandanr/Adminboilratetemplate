import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DataLoading, ProgressService, ProgressStatus, RouteProgress } from '../../core/feedback/progress.service';
import { Button } from '../button';

@Component({ selector: 'smart-spinner', template: `<span class="spinner" [style.width.px]="size()" [style.height.px]="size()" aria-hidden="true"></span><span class="sr-only" role="status">{{ label() }}</span>`, styles: `:host { display:inline-flex; }.spinner { width:20px; height:20px; border:3px solid var(--iam-progress-track); border-top-color:var(--iam-accent); border-radius:50%; animation:spin .8s linear infinite; }@keyframes spin { to { transform:rotate(360deg); } }@media(prefers-reduced-motion:reduce){.spinner{animation:none;}}`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartSpinner { readonly label = input('Loading'); readonly size = input(20); }

/** The one bar renderer used by foreground work, uploads, route reads and server tasks. */
@Component({
    selector: 'smart-progress-bar', imports: [Button],
    template: `
      <div class="track" [class.thin]="size() === 'thin'" role="progressbar" [attr.data-state]="state()"
        [attr.aria-label]="label()" [attr.aria-valuemin]="value() === null ? null : 0"
        [attr.aria-valuemax]="value() === null ? null : 100" [attr.aria-valuenow]="value()"
        [attr.aria-valuetext]="value() !== null ? text() || null : null">
        <span [class.indeterminate]="value() === null && state() === 'running'"
          [style.width.%]="value() ?? (state() === 'running' ? 35 : 0)"></span>
      </div>
      @if (showDetails()) {
        <div class="progress-copy"><span>{{ details() }}</span>@if (value() !== null) { <strong>{{ value() }}%</strong> }</div>
      }
      @if (cancellable() && state() === 'running') { <button iamButton type="button" (click)="cancelled.emit()">Cancel operation</button> }
    `,
    styles: `
      :host { display:block; min-width:0; }
      .track { height:8px; border-radius:999px; overflow:hidden; background:var(--iam-progress-track); }
      .track>span { display:block; height:100%; border-radius:inherit; background:var(--iam-progress-running); }
      [data-state=completed]>span { background:var(--iam-progress-completed); }
      [data-state=failed]>span { background:var(--iam-progress-failed); }
      [data-state=cancelled]>span { background:var(--iam-progress-cancelled); }
      .thin { height:3px; border-radius:0; background:transparent; }
      .progress-copy { display:flex; align-items:start; justify-content:space-between; gap:12px; margin-top:8px;
        color:var(--iam-feedback-muted); font-size:var(--iam-progress-copy-size,var(--iam-font-sm)); line-height:17px; }
      .progress-copy>span { min-width:0; overflow-wrap:anywhere; }strong { flex-shrink:0; font-weight:700; color:var(--iam-feedback-title); }
      .indeterminate { animation:progress-slide 1.5s ease-in-out infinite; }
      @keyframes progress-slide { from { transform:translateX(-100%); }to { transform:translateX(300%); } }
      @media(prefers-reduced-motion:reduce) { .indeterminate { animation:none; } }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartProgressBar {
    readonly label = input.required<string>();
    readonly percentage = input<number | null>(null);
    readonly text = input('');
    readonly status = input<ProgressStatus>('running');
    readonly completed = input<number | null>(null);
    readonly total = input<number | null>(null);
    readonly unit = input('');
    readonly etaSeconds = input<number | null>(null);
    readonly showDetails = input(true);
    readonly size = input<'normal' | 'thin'>('normal');
    readonly cancellable = input(false);
    readonly cancelled = output<void>();
    readonly state = computed(() => this.status() === 'success' ? 'completed' : this.status() === 'error' ? 'failed' : this.status());
    readonly value = computed(() => {
        if (this.state() === 'completed') return 100;
        let value = this.percentage();
        const done = this.completed(), total = this.total();
        if (value === null && done !== null && total !== null && Number.isFinite(done) && Number.isFinite(total) && total > 0 && done >= 0 && done <= total) value = done / total * 100;
        return value !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : null;
    });
    readonly details = computed(() => {
        if (this.text()) return this.text();
        const done = this.completed(), total = this.total(), eta = this.etaSeconds();
        const counts = done !== null && total !== null && Number.isFinite(done) && Number.isFinite(total) && done >= 0 && total > 0 && done <= total
            ? `${done.toLocaleString('en-US')} of ${total.toLocaleString('en-US')}${this.unit() ? ' ' + this.unit() : ''}` : this.label();
        return counts + (eta !== null && Number.isFinite(eta) && eta >= 0 ? ` · about ${Math.ceil(eta)}s left` : '');
    });
}

@Component({ selector: 'smart-progress-status', template: `<span [attr.data-state]="state()">{{ label() || stateLabel() }}</span>`, styles: `span { display:inline-flex; align-items:center; border-radius:999px; padding:2px 10px; background:var(--iam-primary-soft); color:var(--iam-accent); font-size:var(--iam-font-xs); font-weight:600; line-height:16px; }[data-state=completed] { background:var(--iam-feedback-success-fill); color:var(--iam-progress-completed-text); }[data-state=failed] { background:var(--iam-feedback-error-fill); color:var(--iam-progress-failed-text); }[data-state=cancelled] { background:var(--iam-neutral-fill); color:var(--iam-sidebar); }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartProgressStatus {
    readonly state = input<'running' | 'completed' | 'failed' | 'cancelled'>('running');
    readonly label = input('');
    readonly stateLabel = computed(() => ({ running: 'Running', completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' })[this.state()]);
}

@Component({ selector: 'smart-operation-progress', imports: [SmartProgressBar, Button], template: `@for (item of progress.items(); track item.id) { <section class="panel operation"><smart-progress-bar [label]="item.label" [text]="item.text" [percentage]="item.percentage" [status]="item.status" [cancellable]="!!item.cancel" (cancelled)="progress.cancel(item.id)" />@if(item.status !== 'running') { <p role="status">{{ item.label }}: {{ item.status }}</p><button iamButton type="button" (click)="progress.dismiss(item.id)">Dismiss operation</button> }</section> }`, styles: `.operation { padding:16px; margin:8px 0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartOperationProgress {
    readonly progress = inject(ProgressService);
}

@Component({ selector: 'smart-route-progress', imports: [SmartProgressBar], template: `@if (route.loading() || reads.loading()) { <smart-progress-bar label="Loading page data" size="thin" [showDetails]="false" /> }`, styles: `:host { display:block; height:0; position:sticky; top:0; z-index:var(--iam-layer-loading); }smart-progress-bar { position:absolute; inset:0 0 auto; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class SmartRouteProgress {
    readonly route = inject(RouteProgress);
    readonly reads = inject(DataLoading);
}
