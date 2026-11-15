import { Injectable, OnDestroy, signal } from '@angular/core';
export type FeedbackTone = 'success' | 'info' | 'warning' | 'error';
export interface ToastOptions {
    readonly title: string;
    readonly message?: string;
    readonly tone?: FeedbackTone;
    readonly durationMs?: number;
    readonly action?: {
        readonly label: string;
        readonly run: () => void;
    };
}
export interface ToastItem extends ToastOptions {
    readonly id: number;
}
interface ToastTimer {
    remaining: number;
    started: number;
    timer?: ReturnType<typeof setTimeout>;
}
/** Display-safe text only. Callers must never supply credentials or raw exception text. */
@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
    private sequence = 0;
    private readonly current = signal<readonly ToastItem[]>([]);
    readonly items = this.current.asReadonly();
    private readonly timers = new Map<number, ToastTimer>();
    success(title: string, message?: string): number { return this.show({ title, message, tone: 'success' }); }
    info(title: string, message?: string): number { return this.show({ title, message, tone: 'info' }); }
    warning(title: string, message?: string): number { return this.show({ title, message, tone: 'warning' }); }
    error(title: string, message?: string): number { return this.show({ title, message, tone: 'error' }); }
    show(options: ToastOptions): number {
        const id = ++this.sequence;
        const item: ToastItem = { ...options, id, tone: options.tone ?? 'info', title: options.title.slice(0, 160), message: options.message?.slice(0, 600) };
        this.current.update(items => [...items, item]);
        if (this.current().length > 3)
            this.dismiss(this.current()[0].id);
        const duration = options.durationMs ?? (item.tone === 'error' || item.tone === 'warning' ? 9000 : 5000);
        if (Number.isFinite(duration) && duration > 0) {
            this.timers.set(id, { remaining: duration, started: Date.now() });
            this.resume(id);
        }
        return id;
    }
    dismiss(id: number): void { clearTimeout(this.timers.get(id)?.timer); this.timers.delete(id); this.current.update(items => items.filter(item => item.id !== id)); }
    pause(id: number): void {
        const timing = this.timers.get(id);
        if (!timing?.timer) return;
        clearTimeout(timing.timer);
        timing.timer = undefined;
        timing.remaining = Math.max(0, timing.remaining - (Date.now() - timing.started));
    }
    resume(id: number): void {
        const timing = this.timers.get(id);
        if (!timing || timing.timer !== undefined) return;
        timing.started = Date.now();
        timing.timer = setTimeout(() => this.dismiss(id), timing.remaining);
    }
    action(id: number): void { const item = this.current().find(item => item.id === id); this.dismiss(id); try {
        item?.action?.run();
    }
    catch {
        this.show({ title: 'Action failed', message: 'The action could not be completed. Please try again.', tone: 'error' });
    } }
    dismissAll(): void { for (const timing of this.timers.values())
        clearTimeout(timing.timer); this.timers.clear(); this.current.set([]); }
    ngOnDestroy(): void { this.dismissAll(); }
}
