import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { DialogService } from './dialog.service';
import { ProgressService, RouteProgress } from './progress.service';
import { NavigationCancel, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ErrorPresenter } from './error-presenter';
import { ApiError } from '../auth/api-error';
import { SmartConfirmDialog } from '../../shared/ui/dialogs';
import { SmartModal, ModalScrollLock } from '../../shared/ui/modal';
describe('Feedback services and modal interactions', () => {
    beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));
    it('stacks and auto-dismisses messages, pauses active messages and clears timers', () => { jasmine.clock().install(); try {
        const service = TestBed.inject(ToastService);
        const a = service.show({ title: 'A', durationMs: 1000 });
        const b = service.show({ title: 'B', durationMs: 1000 });
        expect(service.items().length).toBe(2);
        service.pause(b);
        jasmine.clock().tick(1000);
        expect(service.items().map(item => item.id)).toEqual([b]);
        service.dismiss(a);
        service.dismissAll();
        expect(service.items()).toEqual([]);
    }
    finally {
        jasmine.clock().uninstall();
    } });
    it('limits visible toast stacking and runs an action only once', () => { const service = TestBed.inject(ToastService); for (let i = 0; i < 10; i++)
        service.show({ title: String(i), durationMs: 0 }); expect(service.items().length).toBe(3); const run = jasmine.createSpy(); const id = service.show({ title: 'Action', action: { label: 'Run', run } }); service.action(id); service.action(id); expect(run).toHaveBeenCalledTimes(1); });
    it('queues dialogs and resolves cancellation without executing work', async () => { const service = TestBed.inject(DialogService); const first = service.confirm({ title: 'First', message: 'Confirm' }); const second = service.message({ title: 'Second', message: 'Info' }); expect(service.requests().length).toBe(2); service.settle(service.requests()[0].id, { confirmed: false }); expect((await first).confirmed).toBeFalse(); service.cancelAll(); expect((await second).confirmed).toBeFalse(); });
    it('requires typed confirmation/reason and prevents duplicate unsafe submissions', async () => { const fixture = TestBed.createComponent(SmartConfirmDialog); let resolve!: () => void; const execute = jasmine.createSpy().and.returnValue(new Promise<void>(done => resolve = done)); fixture.componentRef.setInput('options', { title: 'Delete', message: 'Critical', typedText: 'DELETE', reason: 'required', execute }); fixture.detectChanges(); const dialog = fixture.componentInstance; const done = jasmine.createSpy(); dialog.completed.subscribe(done); await dialog.confirm(); expect(execute).not.toHaveBeenCalled(); dialog.reason.setValue('Approved'); dialog.typed.setValue('DELETE'); const pending = dialog.confirm(); void dialog.confirm(); dialog.cancel(); expect(done).not.toHaveBeenCalled(); expect(execute).toHaveBeenCalledTimes(1); resolve(); await pending; expect(done).toHaveBeenCalledWith({ confirmed: true, reason: 'Approved' }); });
    it('presents async confirmation failure safely and permits an explicit retry', async () => { const fixture = TestBed.createComponent(SmartConfirmDialog); const execute = jasmine.createSpy().and.rejectWith(new Error('SECRET_STACK')); fixture.componentRef.setInput('options', { title: 'Work', message: 'Confirm', execute }); fixture.detectChanges(); await fixture.componentInstance.confirm(); expect(fixture.componentInstance.failure()).not.toContain('SECRET'); expect(fixture.componentInstance.busy()).toBeFalse(); execute.and.resolveTo(undefined); const done = jasmine.createSpy(); fixture.componentInstance.completed.subscribe(done); await fixture.componentInstance.confirm(); expect(done).toHaveBeenCalledWith({ confirmed: true, reason: '' }); });
    it('aborts safely cancellable confirmations and ignores late responses', async () => { const fixture = TestBed.createComponent(SmartConfirmDialog); let resolve!: () => void; let signal!: AbortSignal; fixture.componentRef.setInput('options', { title: 'Work', message: 'Confirm', cancellationSafe: true, execute: (context: {
            signal: AbortSignal;
        }) => { signal = context.signal; return new Promise<void>(done => resolve = done); } }); fixture.detectChanges(); const done = jasmine.createSpy(); fixture.componentInstance.completed.subscribe(done); const pending = fixture.componentInstance.confirm(); fixture.componentInstance.cancel(); expect(signal.aborted).toBeTrue(); resolve(); await pending; expect(done).toHaveBeenCalledTimes(1); expect(done).toHaveBeenCalledWith({ confirmed: false }); });
    it('holds scroll lock until the final nested modal is released', () => { const lock = TestBed.inject(ModalScrollLock); const before = document.body.style.overflow; const first = lock.acquire(); const second = lock.acquire(); first(); expect(document.body.style.overflow).toBe('hidden'); second(); expect(document.body.style.overflow).toBe(before); second(); expect(document.body.style.overflow).toBe(before); });
    it('blocks modal cancellation while closable is false and restores scroll on destruction', () => { const fixture = TestBed.createComponent(SmartModal); fixture.componentRef.setInput('title', 'Blocking'); fixture.componentRef.setInput('open', true); fixture.componentRef.setInput('closable', false); fixture.detectChanges(); const closed = jasmine.createSpy(); fixture.componentInstance.closed.subscribe(closed); fixture.componentInstance.requestClose(); expect(closed).not.toHaveBeenCalled(); expect((fixture.nativeElement as HTMLElement).querySelector('dialog')!.open).toBeTrue(); fixture.destroy(); expect(document.body.style.overflow).not.toBe('hidden'); });
    it('only derives percentages from confirmed valid work and handles cancellation', () => { const service = TestBed.inject(ProgressService); const cancel = jasmine.createSpy(); const id = service.begin('Operation', cancel); expect(service.items()[0].percentage).toBeNull(); service.update(id, { completed: 1, total: 4, text: 'One confirmed' }); expect(service.items()[0].percentage).toBe(25); service.update(id, { percentage: NaN }); expect(service.items()[0].percentage).toBeNull(); service.cancel(id); service.cancel(id); expect(cancel).toHaveBeenCalledTimes(1); expect(service.items()[0].status).toBe('cancelled'); service.dismiss(id); expect(service.items()).toEqual([]); });
    it('never exposes raw errors and only includes safe correlation identifiers', () => { const presenter = TestBed.inject(ErrorPresenter); expect(presenter.describe(new Error('PASSWORD=secret')).message).not.toContain('secret'); const timeout = presenter.describe(new ApiError(0, 'timeout', 'INTERNAL', 'safe-id')); expect(timeout.title).toContain('timed out'); expect(timeout.correlationId).toBe('safe-id'); expect(presenter.describe(new ApiError(500, 'server', 'stack', '<unsafe>')).correlationId).toBeUndefined(); });
    it('keeps route progress active when an older navigation is cancelled', () => { const events = new Subject<unknown>(); TestBed.overrideProvider(Router, { useValue: { events } }); const route = TestBed.inject(RouteProgress); events.next(new NavigationStart(1, '/first')); events.next(new NavigationStart(2, '/second')); events.next(new NavigationCancel(1, '/first', 'Superseded')); expect(route.loading()).toBeTrue(); events.next(new NavigationEnd(2, '/second', '/second')); expect(route.loading()).toBeFalse(); });
});
