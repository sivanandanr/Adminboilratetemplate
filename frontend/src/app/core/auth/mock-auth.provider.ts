import { Injectable, inject } from '@angular/core';
import { Observable, defer, map, timer } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
import { AUTH_CLOCK, AuthProvider, AuthSession, LoginRequest, LoginResult, Permission, ProfilePatch, permissions } from './auth.models';
import { ApiError } from './api-error';

/** SMARTIAM_DEVELOPMENT_MOCK_ONLY — this module must never enter production output. */
@Injectable({ providedIn: 'root' })
export class MockAuthProvider implements AuthProvider {
  private readonly config = inject(AUTH_CONFIG);
  private readonly clock = inject(AUTH_CLOCK);
  private current: AuthSession | null = null;
  private version = 0;
  constructor() { if (this.config.mode !== 'mock') throw new Error('Mock authentication is disabled'); }
  clearLocalSession(): void { this.version++; this.current = null; }
  private delayed<T>(operation: () => T): Observable<T> {
    const version = this.version;
    return defer(() => timer(120).pipe(map(() => { if (version !== this.version) throw new ApiError(401, 'unauthorized', 'Obsolete mock request'); return operation(); })));
  }
  session() {
    return this.delayed(() => {
      if (!this.current || this.current.expiresAt <= this.clock()) { this.current = null; return null; }
      return { ...this.current, serverTime: this.clock() };
    });
  }
  login(request: LoginRequest) {
    return this.delayed<LoginResult>(() => {
      const username = request.username?.trim().toLowerCase();
      // Public, disposable fixtures only. These are not real credentials or security.
      if (request.provider !== 'mock' || !['admin@example.test', 'reader@example.test'].includes(username ?? '') || request.password !== 'Demo-only!23') throw new ApiError(401, 'unauthorized', 'Invalid mock credentials.');
      const admin = username === 'admin@example.test';
      this.current = { serverTime: this.clock(), expiresAt: this.clock() + this.config.mockLifetimeMs, user: {
        id: admin ? 'demo-admin' : 'demo-reader', displayName: admin ? 'Demo Administrator' : 'Demo Reader', username: username!, employeeId: admin ? 'DEMO001' : 'DEMO002',
        email: username!, department: 'IT — IAM', designation: admin ? 'IAM Administrator' : 'Access Reviewer', manager: 'Demo Manager', accountType: 'Development fixture', provider: 'mock',
        roles: admin ? ['Administrator'] : ['Reader'], permissions: admin ? [...permissions] : ['dashboard.view', 'profile.view'],
        editableFields: admin ? ['displayName', 'email', 'department', 'designation'] : [], lastSignIn: this.clock(),
      } };
      return { kind: 'session', session: this.current };
    });
  }
  logout() { return this.delayed(() => { this.current = null; }); }
  renew() {
    return this.delayed(() => {
      this.requireSession(); this.current = { ...this.current!, serverTime: this.clock(), expiresAt: this.clock() + this.config.mockLifetimeMs };
      return this.current;
    });
  }
  updateProfile(patch: ProfilePatch) {
    return this.delayed(() => {
      this.requireSession();
      if (!this.current!.user.permissions.includes('profile.edit')) throw new ApiError(403, 'forbidden', 'Profile editing denied');
      this.current = { ...this.current!, serverTime: this.clock(), user: { ...this.current!.user, ...patch } }; return this.current;
    });
  }
  setPermissions(next: readonly Permission[]): void {
    this.requireSession(); this.current = { ...this.current!, user: { ...this.current!.user, permissions: [...next] } };
  }
  private requireSession(): void { if (!this.current || this.current.expiresAt <= this.clock()) { this.current = null; throw new ApiError(401, 'unauthorized', 'Mock session expired'); } }
}
