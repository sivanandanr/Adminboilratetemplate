import { KpiMetric } from '../../shared/kpi-card';
import { IconName } from '../../shared/icon';

export type DashboardScenario = 'normal' | 'empty' | 'error';
export interface RoleSummary {
  readonly name: string;
  readonly category: 'System' | 'Business' | 'Operational';
  readonly description: string;
  readonly users: number;
  readonly permissions: number;
}
export interface ActivitySummary { readonly id: string; readonly text: string; readonly detail: string; readonly icon: IconName; }
export interface ServiceSummary { readonly name: string; readonly status: string; }
export interface DashboardSnapshot {
  readonly metrics: readonly KpiMetric[];
  readonly roles: readonly RoleSummary[];
  readonly activity: readonly ActivitySummary[];
  readonly services: readonly ServiceSummary[];
}
export type DashboardState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: DashboardSnapshot }
  | { readonly status: 'empty' }
  | { readonly status: 'error'; readonly message: string };
