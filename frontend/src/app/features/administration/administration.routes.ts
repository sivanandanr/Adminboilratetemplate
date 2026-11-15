import { Routes } from '@angular/router';
import { PageMetadata, administrationNavigation } from '../../layout/navigation';
import { requiredForPath } from '../../core/auth/auth.models';
export const administrationRoutes: Routes = [
  {
    path: '', title: 'Administration | SmartIAM',
    data: { label: 'Administration', icon: 'Settings', permissions: ['dashboard.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'Administration Dashboard' }] } satisfies PageMetadata,
    loadComponent: () => import('./overview').then((m) => m.Overview),
  },
  ...administrationNavigation.slice(1).map((item) => ({
    path: item.path.split('/').at(-1)!, title: `${item.label} | SmartIAM`,
    data: { label: item.label, icon: item.icon, permissions: requiredForPath(item.path), breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: item.label }] } satisfies PageMetadata,
    loadComponent: () => import('./workspace-page').then((m) => m.WorkspacePage)
  }))
];
