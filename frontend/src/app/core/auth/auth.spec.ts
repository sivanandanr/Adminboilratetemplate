import { FormControl } from '@angular/forms';
import { DirtyFormsService } from '../feedback/dirty-forms.service';
import { DialogService } from '../feedback/dialog.service';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { AUTH_CONFIG, productionAuthConfig } from './auth.config';
import { AUTH_PROVIDER, AuthProvider, AuthSession, safeReturnUrl } from './auth.models';
import { AuthFacade } from './auth.facade';
import { AuthGuard, PermissionGuard } from './auth.guards';
import { MockAuthProvider } from './mock-auth.provider';
import { SessionChannel } from './session-channel';
import { parseSession } from './session-contract';
import { testSession } from './auth-test.providers';

@Component({ template: '' }) class EmptyPage {}

describe('Authentication contracts and mock provider', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: AUTH_CONFIG, useValue: { ...productionAuthConfig, mode: 'mock' } }] }));
  it('supports successful/failed mock login, profile updates, renewal and logout', async () => {
    const provider = TestBed.inject(MockAuthProvider);
    await expectAsync(firstValueFrom(provider.login({ provider: 'mock', username: 'admin@example.test', password: 'wrong', returnUrl: '/' }))).toBeRejected();
    const result = await firstValueFrom(provider.login({ provider: 'mock', username: 'admin@example.test', password: 'Demo-only!23', returnUrl: '/' }));
    expect(result.kind).toBe('session');
    const profile = await firstValueFrom(provider.updateProfile({ displayName: 'Updated Name' }));
    expect(profile.user.displayName).toBe('Updated Name');
    const renewed = await firstValueFrom(provider.renew()); expect(renewed.expiresAt).toBeGreaterThan(profile.expiresAt);
    await firstValueFrom(provider.logout()); expect(await firstValueFrom(provider.session())).toBeNull();
  });
  it('rejects stale mock requests after local invalidation', async () => {
    const provider = TestBed.inject(MockAuthProvider);
    const response = firstValueFrom(provider.login({ provider: 'mock', username: 'admin@example.test', password: 'Demo-only!23', returnUrl: '/' }));
    provider.clearLocalSession(); await expectAsync(response).toBeRejected();
    expect(await firstValueFrom(provider.session())).toBeNull();
  });
  it('refuses mock construction in production mode', () => {
    TestBed.overrideProvider(AUTH_CONFIG, { useValue: productionAuthConfig });
    expect(() => TestBed.inject(MockAuthProvider)).toThrowError('Mock authentication is disabled');
  });
  it('blocks open redirects and malformed session contracts', () => {
    for (const path of ['//evil.test', 'https://evil.test', '/\\evil.test', '/%2fevil.test', '/login', '/login/other', '/bad\npath']) expect(safeReturnUrl(path)).toBe('/administration');
    expect(safeReturnUrl('/administration/roles?status=active')).toBe('/administration/roles?status=active');
    expect(() => parseSession({ user: {}, expiresAt: 0 })).toThrow();
    const session = testSession();
    const parsed = parseSession({ ...session, user: { ...session.user, permissions: ['profile.view', 'internal.secret.permission'] } });
    expect(parsed.user.permissions).toEqual(['profile.view']);
  });
});

describe('AuthFacade and guards', () => {
  let provider: jasmine.SpyObj<AuthProvider>;
  beforeEach(() => {
    provider = jasmine.createSpyObj<AuthProvider>('AuthProvider', ['session', 'login', 'logout', 'renew', 'updateProfile', 'clearLocalSession']);
    provider.session.and.returnValue(of(testSession())); provider.logout.and.returnValue(of(undefined));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'login', component: EmptyPage }, { path: 'access-denied', component: EmptyPage }]), { provide: AUTH_PROVIDER, useValue: provider }, { provide: SessionChannel, useValue: { messages: of(), send: jasmine.createSpy('broadcast') } }] });
  });
  it('allows Keep editing to cancel voluntary logout, but security expiry bypasses dirty warnings', async () => {
    const auth=TestBed.inject(AuthFacade); await auth.initialize(); const registry=TestBed.inject(DirtyFormsService); const control=new FormControl('edit'); registry.track(control); control.markAsDirty();
    const leaving=auth.logout(); const dialogs=TestBed.inject(DialogService); expect(dialogs.requests().length).toBe(1); dialogs.settle(dialogs.requests()[0].id,{confirmed:false}); await leaving;
    expect(auth.isAuthenticated()).toBeTrue(); expect(provider.logout).not.toHaveBeenCalled(); expect(registry.isDirty()).toBeTrue();
    const secondAttempt=auth.logout(); expect(dialogs.requests().length).toBe(1); await auth.logout('expired'); await secondAttempt; expect(auth.isAuthenticated()).toBeFalse(); expect(registry.isDirty()).toBeFalse(); expect(dialogs.requests().length).toBe(0); expect(provider.logout).toHaveBeenCalledTimes(1);
  });
  it('clears state despite logout failure and ignores late session responses', async () => {
    const auth = TestBed.inject(AuthFacade); await auth.initialize();
    const pending = new Subject<AuthSession | null>(); provider.session.and.returnValue(pending);
    const refresh = auth.revalidate();
    provider.logout.and.returnValue(throwError(() => new Error('offline')));
    await auth.logout(); expect(auth.user()).toBeNull(); expect(auth.logoutFailed()).toBeTrue();
    pending.next(testSession()); pending.complete(); await refresh;
    expect(auth.isAuthenticated()).toBeFalse(); expect(provider.clearLocalSession).toHaveBeenCalled();
  });
  it('refreshes permissions and fails closed when the session cannot be verified', async () => {
    const auth = TestBed.inject(AuthFacade); await auth.initialize();
    const session = testSession(); provider.session.and.returnValue(of({ ...session, user: { ...session.user, permissions: ['profile.view'] } }));
    await auth.revalidate(); expect(auth.can('admin.configure')).toBeFalse(); expect(auth.can('profile.view')).toBeTrue();
    provider.session.and.returnValue(throwError(() => new Error('network'))); await auth.revalidate();
    expect(auth.isAuthenticated()).toBeFalse();
  });
  it('redirects unauthenticated and insufficiently permitted routes', async () => {
    provider.session.and.returnValue(of(null));
    const auth = TestBed.inject(AuthFacade); await auth.initialize();
    const route = new ActivatedRouteSnapshot();
    const state = { url: '/administration/roles' } as RouterStateSnapshot;
    const result = await TestBed.runInInjectionContext(() => AuthGuard(route, state));
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toContain('/login?returnUrl=');
    provider.session.and.returnValue(of({ ...testSession(), user: { ...testSession().user, permissions: ['profile.view'] } })); await auth.reconnect();
    route.data = { permissions: ['admin.configure'] };
    const denied = await TestBed.runInInjectionContext(() => PermissionGuard(route, state));
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/access-denied');
  });
});
