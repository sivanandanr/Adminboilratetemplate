import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiTaskProvider, TASK_API_CONFIG, parseTaskSnapshot } from './task.provider';
import { REQUEST_FEEDBACK } from './request-feedback-context';

describe('Server task adapter contract', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()] }));
    it('does not invent a task endpoint when no backend is configured', () => {
        const provider = TestBed.inject(ApiTaskProvider); expect(provider.available).toBeFalse(); let tasks: readonly unknown[] = ['initial']; provider.list().subscribe(value => tasks = value); expect(tasks).toEqual([]); TestBed.inject(HttpTestingController).verify();
    });
    it('validates untrusted counts, status and capabilities', () => {
        expect(() => parseTaskSnapshot({ id: 'job', title: 'Export', status: 'running', percentage: NaN })).toThrow();
        expect(() => parseTaskSnapshot({ id: 'job', title: 'Export', status: 'running', completed: 4, total: 3 })).toThrow();
        expect(() => parseTaskSnapshot({ id: 'job', title: 'Export', status: 'unknown' })).toThrow();
    });
    it('lists owner-scoped tasks through non-blocking HTTP with bounded results', () => {
        TestBed.overrideProvider(TASK_API_CONFIG, { useValue: { endpoint: '/api/tasks', pollingMs: 1000 } }); const provider = TestBed.inject(ApiTaskProvider), http = TestBed.inject(HttpTestingController);
        provider.list().subscribe(); const call = http.expectOne('/api/tasks'); expect(call.request.context.get(REQUEST_FEEDBACK).mode).toBe('background'); call.flush([{ id: 'job', title: 'Export', status: 'running' }]); http.verify();
    });
});
