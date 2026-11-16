import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { BACKGROUND_TASK_PROVIDER, BackgroundTaskProvider, TaskHandle, TaskService, TaskSnapshot } from './tasks.service';
import { DialogService } from './dialog.service';
import { ToastService } from './toast.service';

@Component({ template: '' }) class TaskDestination {}
describe('Persistent background task orchestration', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection(), provideRouter([{ path: 'other', component: TaskDestination }])] }));
    it('tracks real counts and terminal states, announces once and ignores late work', () => {
        const service = TestBed.inject(TaskService), toasts = TestBed.inject(ToastService);
        const handle = service.start({ title: 'Import', unit: 'rows', total: 10000, run: () => undefined });
        handle.progress(3353, undefined, 8); expect(service.items()[0].completed).toBe(3353); expect(service.items()[0].etaSeconds).toBe(8);
        handle.complete({ message: 'Imported the permitted records.' }); handle.fail('Late failure'); handle.progress(8000);
        expect(service.items()[0].status).toBe('completed'); expect(service.items()[0].percentage).toBe(100); expect(toasts.items().length).toBe(1);
    });
    it('confirms cancellation, retains running on decline and waits for server acknowledgement', async () => {
        const service = TestBed.inject(TaskService), dialogs = TestBed.inject(DialogService), response = new Subject<void>();
        const cancel = jasmine.createSpy().and.returnValue(response);
        const handle = service.start({ title: 'Server import', run: () => undefined, cancel });
        const keep = handle.cancel(); dialogs.settle(dialogs.requests()[0].id, { confirmed: false }); await keep; expect(cancel).not.toHaveBeenCalled();
        const pending = handle.cancel(); dialogs.settle(dialogs.requests()[0].id, { confirmed: true }); await Promise.resolve(); expect(service.items()[0].status).toBe('running'); response.next(); await pending; expect(service.items()[0].status).toBe('cancelled');
    });
    it('does not cancel a task that completes while its confirmation is open', async () => {
        const service = TestBed.inject(TaskService), dialogs = TestBed.inject(DialogService), cancel = jasmine.createSpy().and.returnValue(of(undefined));
        const handle = service.start({ title: 'Export', run: () => undefined, cancel }); const pending = handle.cancel(); handle.complete(); dialogs.settle(dialogs.requests()[0].id, { confirmed: true }); await pending; expect(cancel).not.toHaveBeenCalled(); expect(service.items()[0].status).toBe('completed');
    });
    it('retries a failed monitor without resubmitting the server job', () => {
        const service = TestBed.inject(TaskService); const streams = [new Subject<TaskSnapshot>(), new Subject<TaskSnapshot>()]; let calls = 0;
        const resubmit = jasmine.createSpy();
        service.start({ id: 'existing', title: 'Server task', monitoring: true, run: () => streams[calls++], retry: resubmit }); streams[0].error(new Error('PRIVATE_STACK'));
        expect(service.items()[0].status).toBe('failed'); service.retry('existing'); expect(resubmit).not.toHaveBeenCalled(); expect(calls).toBe(2);
        streams[1].next({ id: 'existing', title: 'Server task', status: 'completed' }); expect(service.items()[0].status).toBe('completed');
    });
    it('ignores an old attempt handle after an explicit retry starts', () => {
        const service = TestBed.inject(TaskService); let old!: TaskHandle, retried!: TaskHandle;
        const task = service.start({ title: 'Import', run: handle => { old = handle; handle.fail('Import failed.'); }, retry: handle => { retried = handle; } });
        service.retry(task.id); old.complete(); expect(service.items()[0].status).toBe('running'); retried.complete(); expect(service.items()[0].status).toBe('completed');
    });
    it('detaches a live monitor when an acknowledged callback completes the task', async () => {
        const service = TestBed.inject(TaskService), stream = new Subject<TaskSnapshot>(); let handle!: TaskHandle;
        service.start({ title: 'Export', run: current => { handle = current; return stream; } }); expect(stream.observers.length).toBe(1);
        handle.complete(); await Promise.resolve(); expect(stream.observers.length).toBe(0); expect(service.items()[0].status).toBe('completed');
    });
    it('preserves monitoring across navigation and detaches on logout without cancelling server work', async () => {
        const service = TestBed.inject(TaskService), monitor = new Subject<TaskSnapshot>(), cancel = jasmine.createSpy().and.returnValue(of(undefined)); service.setOwner('one');
        service.start({ id: 'job', title: 'Export', run: () => monitor, cancel }); await TestBed.inject(Router).navigateByUrl('/other'); expect(monitor.observers.length).toBe(1); expect(service.items().length).toBe(1);
        service.setOwner(null); expect(monitor.observers.length).toBe(0); expect(cancel).not.toHaveBeenCalled(); expect(service.items()).toEqual([]);
    });
    it('rehydrates only the current identity from the configured provider', () => {
        const lists = new Subject<readonly TaskSnapshot[]>(), monitor = new Subject<TaskSnapshot>();
        const provider: BackgroundTaskProvider = { available: true, list: () => lists, watch: () => monitor, cancel: () => of({ id: 'job', title: 'Export', status: 'cancelled' }), retry: () => monitor, download: () => of({ filename: 'export.csv', url: '/api/tasks/job/file' }) };
        TestBed.overrideProvider(BACKGROUND_TASK_PROVIDER, { useValue: provider }); const service = TestBed.inject(TaskService); service.setOwner('one');
        lists.next([{ id: 'job', title: 'Export', status: 'running', canCancel: true }]); expect(service.items().length).toBe(1); service.setOwner(null); lists.next([{ id: 'private', title: 'Old user', status: 'completed' }]); expect(service.items()).toEqual([]);
    });
    it('refuses external downloads and only clears terminal rows when none are running', async () => {
        const service = TestBed.inject(TaskService); let first!: TaskHandle;
        first = service.start({ title: 'Export', run: () => undefined, download: () => of({ filename: 'export.csv', url: 'https://outside.invalid/export' }) }); first.complete({ download: () => of({ filename: 'export.csv', url: 'https://outside.invalid/export' }) });
        await service.download(first.id); expect(TestBed.inject(ToastService).items().some(item => item.title === 'Download unavailable')).toBeTrue();
        const running = service.start({ title: 'Import', run: () => undefined }); service.clearFinished(); expect(service.items().length).toBe(2); running.complete(); service.clearFinished(); expect(service.items()).toEqual([]);
    });
});
