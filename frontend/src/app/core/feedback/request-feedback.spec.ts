import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpEventType, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';
import { AuthInterceptor } from '../auth/auth.interceptor';
import { RequestFeedbackInterceptor } from './request-feedback.interceptor';
import { ErrorPresentationInterceptor, PRESENT_API_ERROR } from './error-presenter';
import { BlockUiService } from './block-ui.service';
import { DataLoading } from './progress.service';
import { ToastService } from './toast.service';
import { requestFeedback } from './request-feedback-context';
import { ConnectionService } from './connection.service';

describe('Part 2 automatic request feedback', () => {
    let http: HttpClient, backend: HttpTestingController, block: BlockUiService;
    beforeEach(() => {
        jasmine.clock().install(); jasmine.clock().mockDate(new Date(1000));
        TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([]),
            { provide: AuthFacade, useValue: { isAuthenticated: () => false } },
            provideHttpClient(withInterceptors([ErrorPresentationInterceptor, RequestFeedbackInterceptor, AuthInterceptor])), provideHttpClientTesting()] });
        http = TestBed.inject(HttpClient); backend = TestBed.inject(HttpTestingController); block = TestBed.inject(BlockUiService);
    });
    afterEach(() => { backend.verify(); TestBed.resetTestingModule(); jasmine.clock().uninstall(); });
    it('delays writes for 300ms and keeps a visible dialog for at least 400ms', () => {
        http.post('/api/records', {}).subscribe(); const request = backend.expectOne('/api/records');
        jasmine.clock().tick(299); expect(block.visible()).toBeFalse(); jasmine.clock().tick(1); expect(block.visible()).toBeTrue();
        request.flush({}); expect(block.active()).toBeFalse(); jasmine.clock().tick(399); expect(block.visible()).toBeTrue(); jasmine.clock().tick(1); expect(block.visible()).toBeFalse();
    });
    it('never flashes for a quick request and releases cancelled requests', () => {
        http.post('/api/records', {}).subscribe(); backend.expectOne('/api/records').flush({}); jasmine.clock().tick(500); expect(block.visible()).toBeFalse();
        const subscription = http.post('/api/records', {}).subscribe(); const request = backend.expectOne('/api/records'); subscription.unsubscribe(); expect(request.cancelled).toBeTrue(); jasmine.clock().tick(500); expect(block.visible()).toBeFalse();
    });
    it('uses the read bar, including POST search, and respects explicit opt-in/out', () => {
        const loading = TestBed.inject(DataLoading);
        http.get('/api/records').subscribe(); expect(loading.loading()).toBeTrue(); expect(block.active()).toBeFalse(); backend.expectOne('/api/records').flush([]); expect(loading.loading()).toBeFalse();
        http.post('/api/search', {}, { context: requestFeedback({ mode: 'read' }) }).subscribe(); expect(loading.loading()).toBeTrue(); expect(block.active()).toBeFalse(); backend.expectOne('/api/search').flush([]);
        http.get('/api/edit', { context: requestFeedback({ blockUi: true, title: 'Opening record' }) }).subscribe(); expect(block.current()?.title).toBe('Opening record'); backend.expectOne('/api/edit').flush({});
        http.post('/api/write', {}, { context: requestFeedback({ blockUi: false }) }).subscribe(); expect(block.active()).toBeFalse(); backend.expectOne('/api/write').flush({});
    });
    it('shares one presentation for concurrent manual and intercepted work', async () => {
        let resolve!: () => void;
        const manual = block.run('Saving your changes', () => new Promise<void>(done => resolve = done), { steps: ['Check', 'Save', 'Confirm'] });
        http.put('/api/records/one', {}).subscribe(); http.delete('/api/records/two').subscribe(); jasmine.clock().tick(300);
        expect(block.current()?.title).toBe('Saving your changes'); backend.expectOne('/api/records/one').flush({}); expect(block.active()).toBeTrue(); backend.expectOne('/api/records/two').flush({}); expect(block.active()).toBeTrue();
        resolve(); await manual; jasmine.clock().tick(400); expect(block.visible()).toBeFalse();
    });
    it('derives percentages only from actual progress events with known totals', () => {
        http.post('/api/upload', new Blob(['content']), { observe: 'events' }).subscribe(); const request = backend.expectOne('/api/upload'); expect(request.request.reportProgress).toBeTrue();
        request.event({ type: HttpEventType.UploadProgress, loaded: 48, total: 100 }); expect(block.current()?.percentage).toBe(48);
        request.event({ type: HttpEventType.UploadProgress, loaded: 49 }); expect(block.current()?.percentage).toBeNull();
        request.flush({});
    });
    it('does not invent elapsed-time percentages and shows the slow note after 8s', () => {
        const handle = block.begin(); jasmine.clock().tick(7999); expect(block.slow()).toBeFalse(); jasmine.clock().tick(1); expect(block.slow()).toBeTrue(); expect(block.current()?.percentage).toBeNull(); handle.end();
    });
    it('reports completed stages explicitly and ignores late updates after end', () => {
        const handle = block.begin({ steps: ['Check', 'Save', 'Confirm'] }); handle.update({ completedSteps: 1 }); expect(block.current()?.percentage).toBeCloseTo(100 / 3); handle.end(); handle.update({ completedSteps: 2 }); expect(block.current()).toBeNull();
    });
    it('clears identity-scoped presentation and ignores old handles without closing new work', () => {
        const old = block.begin({ title: 'Old account operation' }); jasmine.clock().tick(300); block.reset(); expect(block.current()).toBeNull(); expect(block.visible()).toBeFalse();
        const current = block.begin({ title: 'Current account operation' }); jasmine.clock().tick(300); old.end(); old.update({ percentage: 100 }); expect(block.active()).toBeTrue(); expect(block.current()?.title).toBe('Current account operation'); current.end();
    });
    it('shows one safe error toast, closes progress and retains timeout-specific copy', () => {
        const toasts = TestBed.inject(ToastService);
        http.post('/api/error', {}, { context: requestFeedback({}).set(PRESENT_API_ERROR, true) }).subscribe({ error: () => undefined });
        backend.expectOne('/api/error').flush({ message: 'PRIVATE_STACK' }, { status: 500, statusText: 'Server error' }); expect(toasts.items().length).toBe(1); expect(toasts.items()[0].message).not.toContain('PRIVATE_STACK'); expect(block.active()).toBeFalse();
        toasts.dismissAll(); http.post('/api/timeout', {}).subscribe({ error: () => undefined }); const pending = backend.expectOne('/api/timeout'); jasmine.clock().tick(10000);
        expect(pending.cancelled).toBeTrue(); expect(block.active()).toBeFalse(); expect(toasts.items()[0].message).toBe("The server didn't respond. Your changes weren't saved.");
    });
    it('excludes background polling and external requests', () => {
        http.get('/api/task', { context: requestFeedback({ mode: 'background' }) }).subscribe(); http.post('https://example.test/other', {}).subscribe();
        expect(block.active()).toBeFalse(); expect(TestBed.inject(DataLoading).loading()).toBeFalse(); backend.expectOne('/api/task').flush({}); backend.expectOne('https://example.test/other').flush({});
    });
    it('uses a safe connectivity probe without ever replaying a failed write', async () => {
        http.post('/api/write', {}).subscribe({ error: () => undefined }); backend.expectOne('/api/write').error(new ProgressEvent('error'));
        const connection = TestBed.inject(ConnectionService); expect(connection.reachable()).toBeFalse();
        const retry = connection.retry(); const probe = backend.expectOne('/api/auth/session'); expect(probe.request.method).toBe('GET'); expect(probe.request.body).toBeNull(); probe.flush(null); await retry; expect(connection.reachable()).toBeTrue();
    });
});
