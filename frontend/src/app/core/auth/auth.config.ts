import { InjectionToken } from '@angular/core';
import { AuthProviderId } from './auth.models';

export interface AuthConfig {
  readonly mode: 'bff' | 'mock';
  readonly apiBase: string;
  readonly providers: readonly AuthProviderId[];
  readonly rememberUsername: boolean;
  readonly idleTimeoutMs: number;
  readonly warningMs: number;
  readonly mockLifetimeMs: number;
  readonly endpoints: { readonly session: string; readonly login: string; readonly logout: string; readonly renew: string; readonly profile: string; readonly challenge: string; };
}
export const productionAuthConfig: AuthConfig = {
  mode: 'bff', apiBase: '/api', providers: ['local', 'entra', 'ad'], rememberUsername: false,
  idleTimeoutMs: 15 * 60_000, warningMs: 60_000, mockLifetimeMs: 30 * 60_000,
  endpoints: { session: '/auth/session', login: '/auth/login', logout: '/auth/logout', renew: '/auth/renew', profile: '/profile', challenge: '/auth/challenge' },
};
export const AUTH_CONFIG = new InjectionToken<AuthConfig>('AUTH_CONFIG', { providedIn: 'root', factory: () => productionAuthConfig });

export function apiPath(config: AuthConfig, endpoint: string): string {
  if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(config.apiBase) || !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(endpoint)) throw new Error('BFF must use application-relative API paths');
  return config.apiBase.replace(/\/$/, '') + endpoint;
}
