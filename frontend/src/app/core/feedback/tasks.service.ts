import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { Observable, Subscription, firstValueFrom, fromEvent, isObservable, takeUntil } from 'rxjs';
import { DialogService } from './dialog.service';
import { ErrorPresenter } from './error-presenter';
import { ToastService } from './toast.service';
import { AUTH_CONFIG } from '../auth/auth.config';

export type TaskState = 'running' | 'completed' | 'failed' | 'cancelled';
export interface TaskSnapshot {
    readonly id: string;
    readonly title: string;
    readonly status: TaskState;
    readonly percentage?: number | null;
    readonly completed?: number | null;
    readonly total?: number | null;
    readonly unit?: string;
    readonly etaSeconds?: number | null;
    readonly message?: string;
    readonly canCancel?: boolean;
    readonly canDownload?: boolean;
    readonly canRetry?: boolean;
    readonly working?: boolean;
}
export interface TaskDownload { readonly filename: string; readonly url?: string; readonly blob?: Blob; readonly expiresAt?: number; }
export interface TaskHandle {
    readonly id: string;
    /** Aborts client monitoring on identity change/destruction, never the server job. */
    readonly signal: AbortSignal;
    progress(done: number, total?: number, etaSeconds?: number): void;
    update(snapshot: Partial<Omit<TaskSnapshot, 'id'>>): void;
    complete(result?: { readonly message?: string; readonly download?: () => Promise<TaskDownload> | Observable<TaskDownload> }): void;
    fail(message: string): void;
    cancel(): Promise<void>;
}
export type TaskRun = (handle: TaskHandle) => void | Promise<void> | Observable<TaskSnapshot>;
export interface TaskOptions {
    readonly id?: string;
    readonly title: string;
    readonly unit?: string;
    readonly total?: number;
    readonly run: TaskRun;
    readonly cancel?: () => Promise<TaskSnapshot | void> | Observable<TaskSnapshot | void>;
    readonly download?: () => Promise<TaskDownload> | Observable<TaskDownload>;
    readonly retry?: TaskRun;
    readonly initial?: Partial<TaskSnapshot>;
    readonly monitoring?: boolean;
}
export interface BackgroundTaskProvider {
    readonly available: boolean;
    list(): Observable<readonly TaskSnapshot[]>;
    watch(id: string): Observable<TaskSnapshot>;
    cancel(id: string): Observable<TaskSnapshot>;
    retry(id: string): Observable<TaskSnapshot>;
    download(id: string): Observable<TaskDownload>;
}
export const BACKGROUND_TASK_PROVIDER = new InjectionToken<BackgroundTaskProvider | null>('BACKGROUND_TASK_PROVIDER', { providedIn: 'root', factory: () => null });
interface TrackedTask { options: TaskOptions; controller: AbortController; subscription?: Subscription; generation: number; monitorFailed: boolean; }

/** Root-owned monitoring survives route destruction. Server jobs remain server-owned after logout. */
@Injectable({ providedIn: 'root' })
export class TaskService {
    private readonly dialogs = inject(DialogService);
    private readonly toasts = inject(ToastService);
    private readonly errors = inject(ErrorPresenter);
    private readonly provider = inject(BACKGROUND_TASK_PROVIDER);
    private readonly apiBase = inject(AUTH_CONFIG).apiBase;
    private readonly state = signal<readonly TaskSnapshot[]>([]);
    readonly items = this.state.asReadonly();
    readonly running = computed(() => this.items().filter(item => item.status === 'running').length);
    readonly minimized = signal(false);
    readonly restoreError = signal('');
    private readonly tracked = new Map<string, TrackedTask>();
    private sequence = 0;
    private epoch = 0;
    private owner: string | null = null;
    private restoration?: Subscription;
    constructor() { inject(DestroyRef).onDestroy(() => this.clearMonitoring()); }

    setOwner(id: string | null): void {
        if (id === this.owner) return;
        this.owner = id; this.clearMonitoring(); this.state.set([]); this.minimized.set(false); this.restoreError.set('');
        if (id) this.restore();
    }
    restore(): void {
        if (!this.owner || !this.provider?.available) return;
        const epoch = this.epoch;
        this.restoration?.unsubscribe(); this.restoreError.set('');
        this.restoration = this.provider.list().subscribe({
            next: items => {
                if (epoch !== this.epoch) return;
                for (const snapshot of items.slice(0, 50)) {
                    if (this.items().length >= 50) break;
                    if (this.tracked.has(snapshot.id)) continue;
                    const provider = this.provider!;
                    this.start({ id: snapshot.id, title: snapshot.title, initial: snapshot, monitoring: true,
                        run: () => provider.watch(snapshot.id), cancel: () => provider.cancel(snapshot.id),
                        download: () => provider.download(snapshot.id),
                        retry: () => provider.retry(snapshot.id),
                    });
                }
            },
            error: () => { if (epoch === this.epoch) this.restoreError.set('Background tasks could not be restored. Retry to check their status.'); },
        });
    }

    start(options: TaskOptions): TaskHandle {
        const id = options.id ?? `task-${++this.sequence}`;
        if (this.tracked.has(id)) throw new Error('Task IDs must be unique');
        if (this.items().length >= 50) throw new Error('Clear finished tasks before starting more jobs');
        const entry: TrackedTask = { options, controller: new AbortController(), generation: 0, monitorFailed: false };
        this.tracked.set(id, entry);
        this.state.update(items => [...items, { title: options.title, status: 'running', total: options.total, unit: options.unit,
            canCancel: !!options.cancel, canDownload: false, canRetry: !!options.retry, ...options.initial, id }]);
        const handle = this.handle(id, entry);
        if (this.item(id)?.status === 'running') this.invoke(id, entry, options.run);
        return handle;
    }
    private handle(id: string, entry: TrackedTask, generation?: number): TaskHandle {
        const current = () => this.tracked.get(id) === entry && !entry.controller.signal.aborted && (generation === undefined || generation === entry.generation) && this.item(id)?.status === 'running';
        return {
            id, signal: entry.controller.signal,
            progress: (done, total, etaSeconds) => { if (current()) this.update(id, { completed: done, total: total ?? this.item(id)?.total, etaSeconds, percentage: null }); },
            update: snapshot => { if (current()) this.update(id, snapshot); },
            complete: result => {
                if (!current()) return;
                if (result?.download) entry.options = { ...entry.options, download: result.download };
                this.update(id, { status: 'completed', percentage: 100, message: result?.message, canDownload: !!entry.options.download });
            },
            fail: message => { if (current()) this.update(id, { status: 'failed', message }); },
            cancel: () => this.cancel(id),
        };
    }
    private invoke(id: string, entry: TrackedTask, run: TaskRun): void {
        entry.subscription?.unsubscribe();
        const generation = ++entry.generation;
        const failed = (error: unknown) => {
            if (this.tracked.get(id) !== entry || generation !== entry.generation) return;
            entry.monitorFailed = !!entry.options.monitoring;
            this.update(id, { status: 'failed', working: false, canRetry: entry.monitorFailed || !!entry.options.retry,
                message: entry.monitorFailed ? 'Progress could not be checked. Retry checks this job again without starting another job.' : this.errors.describe(error).message });
        };
        try {
            const result = run(this.handle(id, entry, generation));
            if (isObservable(result)) entry.subscription = result.subscribe({ next: snapshot => {
                if (this.tracked.get(id) === entry && generation === entry.generation) {
                    this.update(id, snapshot);
                }
            }, error: failed });
            else if (result) void result.catch(failed);
        } catch (error: unknown) { failed(error); }
    }
    private item(id: string): TaskSnapshot | undefined { return this.items().find(item => item.id === id); }
    private update(id: string, change: Partial<Omit<TaskSnapshot, 'id'>>): void {
        const previous = this.item(id);
        if (!previous || previous.status !== 'running') return;
        const candidate = change.percentage;
        const percentage = candidate === undefined ? previous.percentage : candidate !== null && Number.isFinite(candidate) && candidate >= 0 && candidate <= 100 ? candidate : null;
        const countsValid = change.completed === undefined || change.completed === null || Number.isFinite(change.completed) && change.completed >= 0 && (change.total == null || change.completed <= change.total);
        this.state.update(items => items.map(item => item.id === id ? { ...item, ...change, id, percentage, completed: countsValid ? change.completed ?? item.completed : item.completed } : item));
        if (change.status && change.status !== 'running') {
            const entry = this.tracked.get(id), generation = entry?.generation;
            queueMicrotask(() => {
                if (entry && this.tracked.get(id) === entry && generation === entry.generation && this.item(id)?.status !== 'running') entry.subscription?.unsubscribe();
            });
        }
        if (previous.status === 'running' && change.status === 'completed') this.toasts.success(previous.title, change.message || 'The background task completed.');
        if (previous.status === 'running' && change.status === 'failed') this.toasts.error(previous.title, change.message || 'The background task failed.');
    }
    async cancel(id: string): Promise<void> {
        const entry = this.tracked.get(id), item = this.item(id);
        if (!entry?.options.cancel || !item?.canCancel || item.status !== 'running' || item.working) return;
        const epoch = this.epoch;
        this.patch(id, { working: true });
        const result = await this.dialogs.confirm({ title: 'Cancel this task?', text: item.title, primaryLabel: 'Cancel task', secondaryLabel: 'Keep running', okVariant: 'danger' });
        if (epoch !== this.epoch || this.tracked.get(id) !== entry) return;
        if (!result.confirmed || this.item(id)?.status !== 'running') { this.patch(id, { working: false }); return; }
        try {
            const result = entry.options.cancel();
            const response = await (isObservable(result) ? firstValueFrom(result.pipe(takeUntil(fromEvent(entry.controller.signal, 'abort')))) : result);
            if (epoch !== this.epoch) return;
            if (response) this.update(id, response); else this.update(id, { status: 'cancelled' });
            if (this.item(id)?.status !== 'running') { entry.generation++; entry.subscription?.unsubscribe(); }
        } catch (error: unknown) { if (epoch === this.epoch) this.errors.present(error); }
        finally { if (epoch === this.epoch) this.patch(id, { working: false }); }
    }
    retry(id: string): void {
        const entry = this.tracked.get(id), item = this.item(id);
        if (!entry || item?.status !== 'failed' || item.working || !item.canRetry) return;
        const run = entry.monitorFailed ? entry.options.run : entry.options.retry;
        if (!run) return;
        entry.monitorFailed = false;
        this.patch(id, { status: 'running', message: '', percentage: null, completed: null, working: false });
        this.invoke(id, entry, run);
    }
    async download(id: string): Promise<void> {
        const entry = this.tracked.get(id), item = this.item(id), epoch = this.epoch;
        if (!entry?.options.download || item?.status !== 'completed' || !item.canDownload || item.working) return;
        this.patch(id, { working: true });
        try {
            const result = entry.options.download();
            const file = await (isObservable(result) ? firstValueFrom(result.pipe(takeUntil(fromEvent(entry.controller.signal, 'abort')))) : result);
            if (epoch !== this.epoch) return;
            if (file.expiresAt !== undefined && (!Number.isFinite(file.expiresAt) || file.expiresAt <= Date.now())) throw new Error('Expired download');
            let url: string;
            if (file.blob) url = URL.createObjectURL(file.blob);
            else {
                const target = new URL(file.url ?? '', document.baseURI), base = new URL(this.apiBase, document.baseURI);
                if (!file.url || target.origin !== location.origin || !target.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/') || target.username || target.password) throw new Error('Invalid download URL');
                url = target.href;
            }
            const link = document.createElement('a'); link.href = url; link.download = file.filename.replace(/[\\/\u0000-\u001f]/g, '_').slice(0, 120) || 'download'; link.rel = 'noopener'; link.click();
            if (file.blob) setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch { if (epoch === this.epoch) this.toasts.error('Download unavailable', 'The file is unavailable or expired. Check the task and try again.'); }
        finally { if (epoch === this.epoch) this.patch(id, { working: false }); }
    }
    clearFinished(): void {
        if (this.running() || this.items().some(item => item.working)) return;
        for (const entry of this.tracked.values()) { entry.subscription?.unsubscribe(); entry.controller.abort(); }
        this.tracked.clear(); this.state.set([]);
    }
    private patch(id: string, change: Partial<TaskSnapshot>): void { this.state.update(items => items.map(item => item.id === id ? { ...item, ...change, id } : item)); }
    private clearMonitoring(): void {
        this.epoch++; this.restoration?.unsubscribe();
        for (const entry of this.tracked.values()) { entry.generation++; entry.subscription?.unsubscribe(); entry.controller.abort(); }
        this.tracked.clear();
    }
}
