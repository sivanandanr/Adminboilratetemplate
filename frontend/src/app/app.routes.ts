import { Routes } from '@angular/router';
import { PageMetadata, navigationGroups } from './layout/navigation';
import { AuthGuard, LoginGuard, PermissionGuard } from './core/auth/auth.guards';
import { requiredForPath } from './core/auth/auth.models';
import { developmentRoutes } from '../environments/environment';
import { recordsRoutes } from './features/records/records.routes';

export const routes: Routes = [
{ path: 'login', title: 'Sign In | SmartIAM', canActivate: [LoginGuard], loadComponent: () => import('./features/auth/login').then((m) => m.Login) },
{
  path: '',
  canActivate: [AuthGuard], canActivateChild: [AuthGuard, PermissionGuard],
  loadComponent: () => import('./layout/admin-shell').then((m) => m.AdminShell),
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'administration' },
    {
      path: 'dashboard', title: 'Dashboard | SmartIAM',
      data: { label: 'Dashboard', icon: 'LayoutDashboard', permissions: ['dashboard.view'], breadcrumbs: [{ label: 'Dashboard' }] } satisfies PageMetadata,
      loadComponent: () => import('./features/dashboard/role-dashboard').then((m) => m.RoleDashboard),
    },
    ...recordsRoutes.filter(route=>route.path?.startsWith('administration/')),
    { path: 'administration', loadChildren: () => import('./features/administration/administration.routes').then((m) => m.administrationRoutes) },
    ...navigationGroups.filter((group) => group.id !== 'administration').flatMap((group) => group.items.map((item) => ({
      path: item.path.slice(1), title: `${item.label} | SmartIAM`,
      data: { label: item.label, icon: item.icon, permissions: requiredForPath(item.path), breadcrumbs: [{ label: group.label, path: group.items[0].path }, { label: item.label }] } satisfies PageMetadata,
      loadComponent: () => import('./features/administration/workspace-page').then((m) => m.WorkspacePage),
    }))).filter(route=>!recordsRoutes.some(record=>record.path===route.path)).sort((a, b) => b.path.length - a.path.length),
    ...recordsRoutes.filter(route=>!route.path?.startsWith('administration/')),
    { path: 'profile', title: 'My Profile | SmartIAM', data: { label: 'My Profile', icon: 'UserRound', permissions: ['profile.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'My Profile' }] } satisfies PageMetadata, loadComponent: () => import('./features/auth/profile').then((m) => m.Profile) },
    { path: 'access-denied', title: 'Access Denied | SmartIAM', data: { label: 'Access denied', icon: 'Shield', breadcrumbs: [{ label: 'Access denied' }] } satisfies PageMetadata, loadComponent: () => import('./features/auth/access-denied').then((m) => m.AccessDenied) },
    ...developmentRoutes,
    { path: 'notifications', title: 'Notifications | SmartIAM', data: {label:'Notifications',icon:'Bell',permissions:['profile.view'],breadcrumbs:[{label:'Notifications'}]} satisfies PageMetadata, loadComponent: () => import('./shared/ui/notifications').then(m=>m.SmartNotificationCenter) },
    { path: '**', redirectTo: 'administration' }
  ]
}];
