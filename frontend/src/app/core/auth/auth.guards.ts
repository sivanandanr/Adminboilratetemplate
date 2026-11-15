import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { Permission, safeReturnUrl } from './auth.models';

export const AuthGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthFacade); const router = inject(Router);
  await auth.ready();
  return auth.isAuthenticated() || router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturnUrl(state.url), ...(auth.status() === 'unavailable' ? { reason: 'offline' } : {}) } });
};
export const PermissionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthFacade); const router = inject(Router);
  await auth.ready();
  const required = (route.data['permissions'] ?? []) as readonly Permission[];
  return auth.canAll(required) || router.parseUrl('/access-denied');
};
export const LoginGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthFacade); const router = inject(Router);
  await auth.ready();
  return !auth.isAuthenticated() || router.parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')));
};
