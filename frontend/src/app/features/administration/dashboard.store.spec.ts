import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Observable, Subject, of, throwError } from 'rxjs';
import { DashboardSnapshot } from './dashboard.models';
import { DashboardStore } from './dashboard.store';
import { MockDashboardAdapter, mockDashboard } from './mock-dashboard.adapter';

describe('DashboardStore', () => {
  let adapter: jasmine.SpyObj<MockDashboardAdapter>;
  beforeEach(() => {
    adapter = jasmine.createSpyObj<MockDashboardAdapter>('MockDashboardAdapter', ['load']);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), DashboardStore, { provide: MockDashboardAdapter, useValue: adapter }] });
  });

  it('exposes loading, data, empty and error states and recovers', () => {
    const response = new Subject<DashboardSnapshot | null>();
    adapter.load.and.returnValue(response);
    const store = TestBed.inject(DashboardStore);
    expect(store.state().status).toBe('loading');
    response.next(mockDashboard);
    expect(store.state().status).toBe('ready');
    adapter.load.and.returnValue(of(null)); store.load('empty');
    expect(store.state().status).toBe('empty');
    adapter.load.and.returnValue(throwError(() => new Error('private implementation detail'))); store.load('error');
    const error = store.state();
    expect(error.status).toBe('error');
    if (error.status === 'error') expect(error.message).not.toContain('private implementation detail');
    adapter.load.and.returnValue(of(mockDashboard)); store.load();
    expect(store.state().status).toBe('ready');
  });

  it('cancels obsolete loads and cleans up when its scope is destroyed', () => {
    const cancel = jasmine.createSpy('cancel');
    const stale = new Subject<DashboardSnapshot | null>();
    adapter.load.and.returnValue(new Observable((subscriber) => {
      const subscription = stale.subscribe(subscriber);
      return () => { subscription.unsubscribe(); cancel(); };
    }));
    const store = TestBed.inject(DashboardStore);
    adapter.load.and.returnValue(of(null)); store.load('empty');
    expect(cancel).toHaveBeenCalledTimes(1);
    stale.next(mockDashboard);
    expect(store.state().status).toBe('empty');
    adapter.load.and.returnValue(new Observable(() => cancel)); store.load();
    TestBed.resetTestingModule();
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});
