import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const permissions = ['dashboard.view', 'admin.view', 'admin.configure', 'profile.view', 'profile.edit', 'showcase.view'] as const;
export type Permission = typeof permissions[number];
export type AuthProviderId = 'mock' | 'local' | 'entra' | 'ad';
export type ProfileField = 'displayName' | 'email' | 'department' | 'designation';
export interface UserProfile {
  readonly id: string;
  readonly displayName: string;
  readonly username: string;
  readonly employeeId: string;
  readonly email: string;
  readonly department: string;
  readonly designation: string;
  readonly manager: string;
  readonly accountType: string;
  readonly provider: AuthProviderId;
  readonly roles: readonly string[];
  readonly permissions: readonly Permission[];
  readonly editableFields: readonly ProfileField[];
  readonly lastSignIn: number | null;
}
export type ProfilePatch = Partial<Pick<UserProfile, ProfileField>>;
export interface AuthSession { readonly user: UserProfile; readonly serverTime: number; readonly expiresAt: number; }
export interface LoginRequest { readonly provider: AuthProviderId; readonly username?: string; readonly password?: string; readonly returnUrl: string; }
export type LoginResult = { readonly kind: 'session'; readonly session: AuthSession } | { readonly kind: 'redirect'; readonly url: string };
export interface AuthProvider {
  session(): Observable<AuthSession | null>;
  login(request: LoginRequest): Observable<LoginResult>;
  logout(): Observable<void>;
  renew(): Observable<AuthSession>;
  updateProfile(patch: ProfilePatch): Observable<AuthSession>;
  clearLocalSession(): void;
}
export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER');
export const AUTH_CLOCK = new InjectionToken<() => number>('AUTH_CLOCK', { providedIn: 'root', factory: () => Date.now });

export function requiredForPath(path: string): readonly Permission[] {
  if (path === '/access-denied') return [];
  if (path.startsWith('/auth-showcase') || path.startsWith('/dev/components')) return ['showcase.view'];
  if (path === '/dashboard' || path === '/administration') return ['dashboard.view'];
  if (path === '/profile' || path === '/notifications') return ['profile.view'];
  if (path === '/administration/system') return ['admin.configure'];
  return ['admin.view'];
}

/** Only application-local paths can be used after login or backend challenges. */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !/^\/(?!\/)/.test(value) || /[\\\s\u0000-\u001f]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f])/i.test(value)) return '/administration';
  try {
    const url = new URL(value, 'https://smartiam.invalid');
    if (url.origin !== 'https://smartiam.invalid' || /^\/login(?:\/|$)/.test(url.pathname)) return '/administration';
    return url.pathname + url.search + url.hash;
  } catch { return '/administration'; }
}
