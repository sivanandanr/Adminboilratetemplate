import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

export interface KpiMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: IconName;
  readonly tone: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'iam-kpi-card',
  imports: [Icon],
  template: `
    <article class="panel" [attr.aria-label]="metric().label" [attr.aria-busy]="loading()">
      <span class="metric-icon" [class]="'metric-icon ' + metric().tone"><iam-icon [name]="metric().icon" [size]="28" /></span>
      <div class="metric-content">
        <strong class="value" [class.skeleton]="loading()">{{ loading() ? '—' : metric().value }}</strong>
        <h2>{{ metric().label }}</h2>
        <p>{{ loading() ? 'Loading…' : metric().detail }}</p>
        <ng-content />
      </div>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    article { display: flex; gap: var(--iam-space-3); align-items: center; padding: var(--iam-space-2) var(--iam-space-3); min-height: var(--iam-kpi-height); height: 100%; }
    .metric-icon { display: grid; place-items: center; flex-shrink: 0; width: 48px; height: 48px; border-radius: 50%; color: var(--iam-accent); background: var(--iam-primary-soft); }
    .success { background: var(--iam-success-fill); color: var(--iam-success-text); }
    .warning { background: var(--iam-warning-fill); color: var(--iam-icon-notifications); }
    .danger { background: var(--iam-danger-fill); color: var(--iam-icon-danger); }
    .info { background: var(--iam-info-fill); color: var(--iam-info-text); }
    .metric-content { min-width: 0; }.value { display: block; font-size: var(--iam-font-title); line-height: 1.1; font-weight: 700; }
    h2 { font-size: var(--iam-font-xs); line-height: 1.2; font-weight: 600; margin: 2px 0 4px; }p { font-size: var(--iam-font-xs); line-height: 1.2; margin: 0; color: var(--iam-text-secondary); }
    .skeleton { background: var(--iam-primary-soft); color: transparent; border-radius: var(--iam-radius-sm); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCard {
  readonly metric = input.required<KpiMetric>();
  readonly loading = input(false);
}
