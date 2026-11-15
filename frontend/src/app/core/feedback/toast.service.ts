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
/** Display-safe text only. Callers must never supply credentials or raw exception text. */
@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
    private sequence = 0;
    private readonly current = signal<readonly ToastItem[]>([]);
    readonly items = this.current.asReadonly();
    private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
    show(options: ToastOptions): number {
        const id = ++this.sequence;
        const item: ToastItem = { ...options, id, tone: options.tone ?? 'info', title: options.title.slice(0, 160), message: options.message?.slice(0, 600) };
        this.current.update(items => [...items, item]);
        if (this.current().length > 8)
            this.dismiss(this.current()[0].id);
        const duration = options.durationMs ?? (options.action || item.tone === 'error' ? 0 : 6000);
        if (Number.isFinite(duration) && duration > 0)
            this.timers.set(id, setTimeout(() => this.dismiss(id), Math.max(1000, duration)));
        return id;
    }
    dismiss(id: number): void { clearTimeout(this.timers.get(id)); this.timers.delete(id); this.current.update(items => items.filter(item => item.id !== id)); }
    pause(id: number): void { clearTimeout(this.timers.get(id)); this.timers.delete(id); } // Focus/hover makes a toast persistent until dismissal.
    action(id: number): void { const item = this.current().find(item => item.id === id); this.dismiss(id); try {
        item?.action?.run();
    }
    catch {
        this.show({ title: 'Action failed', message: 'The action could not be completed. Please try again.', tone: 'error' });
    } }
    dismissAll(): void { for (const id of this.timers.keys())
        clearTimeout(this.timers.get(id)); this.timers.clear(); this.current.set([]); }
    ngOnDestroy(): void { this.dismissAll(); }
}
