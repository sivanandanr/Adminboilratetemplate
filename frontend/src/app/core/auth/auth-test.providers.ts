import { Provider } from '@angular/core';
import { NEVER, of } from 'rxjs';
import { AUTH_PROVIDER, AuthProvider, AuthSession, permissions } from './auth.models';
import { SessionChannel } from './session-channel';
import { NOTIFICATION_PROVIDER } from '../notifications/notification.models';

export function testSession(): AuthSession {
  return { serverTime: Date.now(), expiresAt: Date.now() + 3600_000, user: {
    id: 'test-user', displayName: 'Test Administrator', username: 'test@example.test', employeeId: 'TEST001', email: 'test@example.test', department: 'IT', designation: 'Administrator', manager: 'Test Manager', accountType: 'Test', provider: 'local',
    roles: ['Administrator'], permissions: [...permissions], editableFields: ['displayName', 'email', 'department', 'designation'], lastSignIn: Date.now(),
  } };
}
export function authTestProviders(): Provider[] {
  const provider: AuthProvider = {
    session: () => of(testSession()), login: () => of({ kind: 'session', session: testSession() }), logout: () => of(undefined), renew: () => of(testSession()),
    updateProfile: (patch) => of({ ...testSession(), user: { ...testSession().user, ...patch } }), clearLocalSession: () => undefined,
  };
  return [{ provide: NOTIFICATION_PROVIDER, useValue: { list: () => of({items:[],unreadCount:0}), markRead: () => of(undefined), markAllRead: () => of(undefined), clearCache: () => undefined } }, { provide: AUTH_PROVIDER, useValue: provider }, { provide: SessionChannel, useValue: { messages: NEVER, send: () => undefined } }];
}
