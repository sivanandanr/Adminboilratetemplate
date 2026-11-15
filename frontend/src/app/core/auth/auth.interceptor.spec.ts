import { HttpClient, provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { MockPlatformLocation } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { AuthInterceptor } from './auth.interceptor';
import { authTestProviders } from './auth-test.providers';
import { BffAuthProvider } from './bff-auth.provider';
import { ApiError } from './api-error';

describe('AuthInterceptor and BFF adapter', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthFacade;
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([]), { provide: PlatformLocation, useFactory: () => new MockPlatformLocation({ startUrl: window.location.href }) }, ...authTestProviders(),
      provideHttpClient(withInterceptors([AuthInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })), provideHttpClientTesting(),
    ] });
    http = TestBed.inject(HttpClient); backend = TestBed.inject(HttpTestingController); auth = TestBed.inject(AuthFacade); await auth.initialize();
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true); spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  });
  afterEach(() => { backend.verify(); document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/'; });
  it('adds correlation, credentials and CSRF to BFF mutations only', () => {
    document.cookie = 'XSRF-TOKEN=csrf-example; Path=/';
    http.post('/api/profile', {}).subscribe();
    const request = backend.expectOne('/api/profile');
    expect(request.request.withCredentials).toBeTrue(); expect(request.request.headers.get('X-Correlation-ID')).toMatch(/^[a-f0-9-]{36}$/);
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-example'); request.flush({});
    http.get('https://external.invalid/api/session').subscribe();
    const external = backend.expectOne('https://external.invalid/api/session');
    expect(external.request.withCredentials).toBeFalse(); expect(external.request.headers.has('X-Correlation-ID')).toBeFalse(); external.flush({});
  });
  it('clears authentication on 401 and navigates to access denied on 403', () => {
    http.get('/api/protected').subscribe({ error: (error: unknown) => expect(error instanceof ApiError).toBeTrue() });
    backend.expectOne('/api/protected').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/access-denied'); expect(auth.isAuthenticated()).toBeTrue();
    http.get('/api/protected').subscribe({ error: () => undefined });
    backend.expectOne('/api/protected').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.user()).toBeNull(); expect(auth.expiredNotice()).toBeTrue();
  });
  it('never retries a failed mutation or invalid login', () => {
    http.post('/api/profile', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/profile').flush({}, { status: 503, statusText: 'Unavailable' }); backend.expectNone('/api/profile');
    TestBed.inject(BffAuthProvider).login({ provider: 'local', username: 'someone', password: 'not-a-real-secret', returnUrl: '/' }).subscribe({ error: () => undefined });
    backend.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBeTrue();
  });
  it('retries a transient GET once and normalizes network failures', async () => {
    let error: ApiError | undefined;
    http.get('/api/transient').subscribe({ error: (value: ApiError) => { error = value; } });
    backend.expectOne('/api/transient').error(new ProgressEvent('error'));
    await new Promise((resolve) => setTimeout(resolve, 130));
    backend.expectOne('/api/transient').error(new ProgressEvent('error'));
    expect(error?.kind).toBe('network'); expect(error?.message).not.toContain('ProgressEvent');
  });
  it('initiates external login only through the configured same-origin BFF challenge', () => {
    TestBed.inject(BffAuthProvider).login({ provider: 'entra', returnUrl: '//evil.invalid' }).subscribe((result) => {
      expect(result.kind).toBe('redirect'); if (result.kind === 'redirect') expect(result.url).toBe('/api/auth/challenge/entra?returnUrl=%2Fadministration');
    }); backend.expectNone('/api/auth/login');
  });
  it('treats an already expired backend logout as completed', () => {
    let completed = false;
    TestBed.inject(BffAuthProvider).logout().subscribe({ complete: () => { completed = true; } });
    backend.expectOne('/api/auth/logout').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(completed).toBeTrue();
  });
});
