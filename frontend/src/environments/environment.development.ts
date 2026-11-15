import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthConfig, productionAuthConfig } from '../app/core/auth/auth.config';
import { MockAuthProvider } from '../app/core/auth/mock-auth.provider';

// A dev/test-only runtime hook. The production replacement has no such hook/import.
const overrides = (globalThis as { __SMARTIAM_MOCK_CONFIG__?: { idleTimeoutMs?: number; warningMs?: number; mockLifetimeMs?: number } }).__SMARTIAM_MOCK_CONFIG__;
const duration = (value: number | undefined, fallback: number) => value !== undefined && Number.isFinite(value) && value >= 1000 ? value : fallback;
const idleTimeoutMs = duration(overrides?.idleTimeoutMs, 5 * 60_000);
const auth: AuthConfig = { ...productionAuthConfig, mode: 'mock', providers: ['mock'], rememberUsername: true,
  idleTimeoutMs, warningMs: Math.min(duration(overrides?.warningMs, 30_000), idleTimeoutMs - 500), mockLifetimeMs: duration(overrides?.mockLifetimeMs, 15 * 60_000),
};
export const environment = { production: false, auth, createAuthProvider: () => inject(MockAuthProvider) };
export const developmentRoutes: Routes = [{ path: 'dev/components', title: 'Component Library | SmartIAM', data: { label: 'Component Library', icon: 'Layers', permissions: ['showcase.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'Component Library' }] }, loadComponent: () => import('../app/features/dev/components-showcase').then(m => m.ComponentsShowcase) }, {
  path: 'auth-showcase', title: 'Authentication Showcase | SmartIAM',
  data: { label: 'Authentication Showcase', icon: 'Shield', permissions: ['showcase.view'], breadcrumbs: [{ label: 'Administration', path: '/administration' }, { label: 'Authentication Showcase' }] },
  loadComponent: () => import('../app/features/auth/auth-showcase').then((m) => m.AuthShowcase),
}];
