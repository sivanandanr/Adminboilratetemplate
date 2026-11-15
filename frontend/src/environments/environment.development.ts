import { MockGridHttpInterceptor } from '../app/features/dev/grid/mock-grid-api';
import { MockRoleDashboardProvider } from '../app/features/dev/mock-role-dashboard.provider';
import { MockRecordsProvider } from '../app/features/dev/mock-records.provider';
import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthConfig, productionAuthConfig } from '../app/core/auth/auth.config';
import { MockAuthProvider } from '../app/core/auth/mock-auth.provider';
import { MockNotificationProvider } from '../app/core/notifications/mock-notification.provider';
import { UnsavedChangesGuard } from '../app/shared/ui/wizard';

// A dev/test-only runtime hook. The production replacement has no such hook/import.
const overrides = (globalThis as { __SMARTIAM_MOCK_CONFIG__?: { idleTimeoutMs?: number; warningMs?: number; mockLifetimeMs?: number } }).__SMARTIAM_MOCK_CONFIG__;
const duration = (value: number | undefined, fallback: number) => value !== undefined && Number.isFinite(value) && value >= 1000 ? value : fallback;
const idleTimeoutMs = duration(overrides?.idleTimeoutMs, 5 * 60_000);
const auth: AuthConfig = { ...productionAuthConfig, mode: 'mock', providers: ['mock'], rememberUsername: true,
  idleTimeoutMs, warningMs: Math.min(duration(overrides?.warningMs, 30_000), idleTimeoutMs - 500), mockLifetimeMs: duration(overrides?.mockLifetimeMs, 15 * 60_000),
};
export const environment = { production: false, auth, createAuthProvider: () => inject(MockAuthProvider), createNotificationProvider: () => inject(MockNotificationProvider), createDashboardProvider:()=>inject(MockRoleDashboardProvider),createRecordsProvider:()=>inject(MockRecordsProvider), developmentInterceptors: [MockGridHttpInterceptor] };
export const developmentRoutes: Routes = [
 ...(['client','server','export','selection'] as const).map(gridMode=>({path:'dev/grid/'+gridMode,title:'Enterprise Grid | SmartIAM',data:{label:'Enterprise Grid',icon:'Users',permissions:['showcase.view'],breadcrumbs:[{label:'Enterprise Grid'}],gridMode},loadComponent:()=>import('../app/features/dev/grid/grid-showcase').then(m=>m.GridShowcase)})),

 {path:'dev/feedback',title:'Feedback Showcase | SmartIAM',data:{label:'Feedback Showcase',icon:'Bell',permissions:['showcase.view'],breadcrumbs:[{label:'Feedback Showcase'}]},loadComponent:()=>import('../app/features/dev/feedback-showcase').then(m=>m.FeedbackShowcase)},
 {path:'dev/wizard',title:'Application Registration | SmartIAM',canDeactivate:[UnsavedChangesGuard],data:{label:'Application Registration',icon:'Layers',permissions:['showcase.view'],breadcrumbs:[{label:'Application Registration'}]},loadComponent:()=>import('../app/features/dev/wizard-showcase').then(m=>m.WizardShowcase)},
 {path:'dev/notifications',title:'Notification Showcase | SmartIAM',data:{label:'Notification Showcase',icon:'Bell',permissions:['showcase.view'],breadcrumbs:[{label:'Notification Showcase'}]},loadComponent:()=>import('../app/features/dev/notifications-showcase').then(m=>m.NotificationsShowcase)},
{ path: 'dev/components', title: 'Component Library | SmartIAM', data: { label: 'Component Library', icon: 'Layers', permissions: ['showcase.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'Component Library' }] }, loadComponent: () => import('../app/features/dev/components-showcase').then(m => m.ComponentsShowcase) }, {
  path: 'auth-showcase', title: 'Authentication Showcase | SmartIAM',
  data: { label: 'Authentication Showcase', icon: 'Shield', permissions: ['showcase.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'Authentication Showcase' }] },
  loadComponent: () => import('../app/features/auth/auth-showcase').then((m) => m.AuthShowcase),
}];
