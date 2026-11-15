import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AUTH_CONFIG, productionAuthConfig } from './auth.config';
import { AUTH_CLOCK } from './auth.models';
import { AuthFacade } from './auth.facade';
import { SessionService } from './session.service';
import { SessionChannel, SessionEvent } from './session-channel';
import { testSession } from './auth-test.providers';

describe('SessionService', () => {
  let now: number;
  let events: Subject<SessionEvent>;
  let auth: ReturnType<typeof createAuth>;
  const createAuth = () => {
    const session = signal({ ...testSession(), serverTime: 0, expiresAt: 100_000 });
    return { session, user: () => session().user, isAuthenticated: () => true, serverNow: () => now,
      logout: jasmine.createSpy('logout').and.resolveTo(), invalidate: jasmine.createSpy('invalidate'), renew: jasmine.createSpy('renew').and.resolveTo(false), revalidate: jasmine.createSpy('revalidate').and.resolveTo(true) };
  };
  beforeEach(() => {
    now = 0; events = new Subject(); auth = createAuth();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), { provide: AUTH_CLOCK, useValue: () => now }, { provide: AUTH_CONFIG, useValue: { ...productionAuthConfig, idleTimeoutMs: 10_000, warningMs: 3000 } }, { provide: AuthFacade, useValue: auth }, { provide: SessionChannel, useValue: { messages: events, send: jasmine.createSpy('send') } }] });
  });
  it('warns, ignores activity during the warning, and expires by elapsed time', () => {
    const session = TestBed.inject(SessionService); session.check();
    now = 7000; session.check(); expect(session.warning()).toBeTrue(); expect(session.remaining()).toBe(3);
    session.recordActivity(); now = 10_000; session.check(); expect(auth.logout).toHaveBeenCalledWith('expired');
  });
  it('does not extend a warning unless renewal succeeds', async () => {
    const session = TestBed.inject(SessionService); session.check(); now = 8000; session.check();
    await session.continueSession(); expect(session.warning()).toBeTrue();
    auth.renew.and.resolveTo(true); await session.continueSession(); expect(session.warning()).toBeFalse();
    now = 16_000; session.check(); expect(auth.logout).not.toHaveBeenCalled();
  });
  it('caps idle time at server expiry and handles logout/activity from another tab', () => {
    const session = TestBed.inject(SessionService); session.check();
    now = 5000; events.next({ type: 'activity', at: 5000 }); now = 9000; session.check(); expect(session.warning()).toBeFalse();
    auth.session.update((snapshot) => ({ ...snapshot, expiresAt: 9500 })); now = 9500; session.check(); expect(auth.logout).toHaveBeenCalledWith('expired');
    events.next({ type: 'logout', at: now }); expect(auth.invalidate).toHaveBeenCalledWith('logout', false);
  });
  it('detects suspended-tab expiry on visibility return without resetting activity', () => {
    const session = TestBed.inject(SessionService); session.check();
    now = 60_000; document.dispatchEvent(new Event('visibilitychange'));
    expect(auth.logout).toHaveBeenCalledWith('expired');
  });
  it('keeps the deadline and warning when renewal fails', async () => {
    const session = TestBed.inject(SessionService); session.check(); now = 8000; session.check();
    auth.renew.and.rejectWith(new Error('offline')); await session.continueSession();
    expect(session.warning()).toBeTrue(); expect(session.renewalError()).toContain('has not been extended');
    now = 10_000; session.check(); expect(auth.logout).toHaveBeenCalledWith('expired');
  });
  it('does not let background session snapshots reset idle time', () => {
    const session = TestBed.inject(SessionService); session.check(); now = 5000;
    auth.session.update((snapshot) => ({ ...snapshot, serverTime: now })); session.check();
    now = 10_000; session.check(); expect(auth.logout).toHaveBeenCalledWith('expired');
  });
});
