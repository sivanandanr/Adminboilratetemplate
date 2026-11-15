import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Permission } from '../../core/auth/auth.models';
import { KpiMetric } from '../kpi-card';

export type DashboardRole = 'employee' | 'manager' | 'iam' | 'system';
export type WidgetKind = 'kpi' | 'status' | 'chart' | 'activity' | 'tasks' | 'actions' | 'risk' | 'notifications';
export interface WidgetItem { readonly id: string; readonly label: string; readonly detail: string; readonly path?: string; readonly value?: number; }
export interface DashboardWidget {
  readonly id: string;
  readonly kind: WidgetKind;
  readonly title: string;
  readonly permissions: readonly Permission[];
  readonly metric?: KpiMetric;
  readonly trend?: { readonly direction: 'up' | 'down' | 'flat'; readonly label: string };
  readonly items: readonly WidgetItem[];
}
export interface DashboardData { readonly mock: boolean; readonly refreshedAt: string; readonly widgets: readonly DashboardWidget[]; }
export interface DashboardProvider { load(role: DashboardRole): Observable<DashboardData>; }
export const DASHBOARD_PROVIDER = new InjectionToken<DashboardProvider>('DASHBOARD_PROVIDER');
export const widgetRegistry: Readonly<Record<WidgetKind, { readonly label: string; readonly span: 'small' | 'wide' }>> = {
  kpi: { label: 'KPI card', span: 'small' }, status: { label: 'Status summary', span: 'wide' },
  chart: { label: 'Chart container', span: 'wide' }, activity: { label: 'Activity feed', span: 'wide' },
  tasks: { label: 'Pending tasks', span: 'wide' }, actions: { label: 'Quick actions', span: 'wide' },
  risk: { label: 'Risk summary', span: 'wide' }, notifications: { label: 'Notification summary', span: 'wide' },
};
export const dashboardRoles: readonly { id: DashboardRole; label: string; permissions: readonly Permission[] }[] = [
  { id: 'employee', label: 'Employee', permissions: ['dashboard.view'] },
  { id: 'manager', label: 'Manager', permissions: ['dashboard.view', 'admin.view'] },
  { id: 'iam', label: 'IAM Administrator', permissions: ['dashboard.view', 'admin.view'] },
  { id: 'system', label: 'System Administrator', permissions: ['dashboard.view', 'admin.configure'] },
];
