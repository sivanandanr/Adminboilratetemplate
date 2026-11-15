import { SmartTable } from '../ui/table';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KpiCard } from '../kpi-card';
import { FeedbackState } from '../feedback-state';
import { DashboardWidget, widgetRegistry } from './dashboard.models';

@Component({
  selector: 'smart-dashboard-widget', imports: [SmartTable,RouterLink, KpiCard, FeedbackState],
  template: `@if(state() === 'loading'){<section class="panel widget" role="status" aria-busy="true">Loading {{ widget().title }}…</section>}
  @else if(state() === 'error'){<iam-feedback-state kind="error" [title]="widget().title + ' unavailable'" description="Refresh to try again." actionLabel="Retry widget" (retry)="retried.emit()" />}
  @else if(state() === 'empty'){<iam-feedback-state kind="empty" [title]="widget().title" description="No data to display." />}
  @else if(widget().kind === 'kpi' && widget().metric){<iam-kpi-card [metric]="widget().metric!">@if(widget().trend; as trend){<p class="trend">{{ trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '↔' }} {{ trend.label }}</p>}</iam-kpi-card>}
  @else {<section class="panel widget" [attr.aria-label]="widget().title"><h2>{{ widget().title }}</h2>
    @if(widget().kind === 'chart'){<p class="muted">Counts by category · table provides the chart values</p><div class="bars" aria-hidden="true">@for(item of widget().items;track item.id){<div class="bar-row"><span>{{ item.label }}</span><span class="bar" [style.width.%]="(item.value ?? 0) / maximum() * 65"></span></div>}</div><smart-table [label]="widget().title"><table><caption class="sr-only">{{ widget().title }} data</caption><thead><tr><th scope="col">Category</th><th scope="col">Count</th></tr></thead><tbody>@for(item of widget().items;track item.id){<tr><th scope="row">{{ item.label }}</th><td>{{ item.value }}</td></tr>}</tbody></table></smart-table>}
    @else {<ul [class.actions]="widget().kind==='actions'">@for(item of widget().items;track item.id){<li>@if(item.path){<a [routerLink]="item.path">{{ item.label }}</a>}@else{<strong>{{ item.label }}</strong>}<span>{{ item.detail }}</span></li>}@empty{<li>No items available.</li>}</ul>}
  </section>}`,
  styles: `:host { display:block; min-width:0; position:relative; }.widget { padding:16px; height:100%; }h2 { font-size:var(--iam-font-lg); margin:0 0 12px; }ul { list-style:none; padding:0; margin:0; }li { padding:10px 0; border-bottom:1px solid var(--iam-border); }li:last-child { border:0; }li span { display:block; color:var(--iam-text-secondary); font-size:var(--iam-font-xs); margin-top:4px; }a { color:var(--iam-accent); font-weight:600; }.trend { margin:4px 0 0; font-size:var(--iam-font-xs); color:var(--iam-text-secondary); }.muted { color:var(--iam-text-secondary); font-size:var(--iam-font-xs); }.bar-row { display:flex; align-items:center; gap:8px; margin:8px 0; }.bar-row>span:first-child { width:90px; }.bar { display:block; background:var(--iam-primary); height:14px; border-radius:var(--iam-radius-sm); }.actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }.actions li { border:1px solid var(--iam-border); border-radius:var(--iam-radius-md); padding:8px; }smart-table { --smart-table-border:0; }table { width:100%; border-collapse:collapse; }th,td { text-align:left; padding:6px; border-bottom:1px solid var(--iam-border); }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardWidgetComponent {
  readonly widget = input.required<DashboardWidget>();
  readonly state = input<'ready' | 'loading' | 'empty' | 'error'>('ready');
  readonly retried = output<void>();
  readonly registry = widgetRegistry;
  readonly maximum = computed(() => Math.max(1, ...this.widget().items.map(item => item.value ?? 0)));
}
