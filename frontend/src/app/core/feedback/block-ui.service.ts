import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import { ErrorPresenter } from './error-presenter';

export interface BlockUiOptions {
    readonly title?: string;
    readonly message?: string;
    readonly steps?: readonly string[];
}
export interface BlockUiProgress {
    readonly percentage?: number | null;
    readonly text?: string;
    /** Number of server-confirmed completed steps; never an elapsed-time estimate. */
    readonly completedSteps?: number;
}
export interface BlockUiOperation extends BlockUiOptions {
    readonly id: number;
    readonly percentage: number | null;
    readonly text: string;
    readonly completedSteps: number;
}
export interface BlockUiHandle {
    update(progress: BlockUiProgress): void;
    end(): void;
}

/** One reference-counted presentation, shared by manual work and intercepted requests. */
@Injectable({ providedIn: 'root' })
export class BlockUiService implements OnDestroy {
    private readonly errors = inject(ErrorPresenter);
    private readonly operations = signal<readonly BlockUiOperation[]>([]);
    private readonly retained = signal<BlockUiOperation | null>(null);
    readonly current = computed(() => this.operations()[0] ?? this.retained());
    readonly active = computed(() => this.operations().length > 0);
    readonly visible = signal(false);
    readonly slow = signal(false);
    private sequence = 0;
    private epoch = 0;
    private shownAt = 0;
    private showTimer?: ReturnType<typeof setTimeout>;
    private hideTimer?: ReturnType<typeof setTimeout>;
    private slowTimer?: ReturnType<typeof setTimeout>;

    begin(options: BlockUiOptions = {}): BlockUiHandle {
        const id = ++this.sequence;
        clearTimeout(this.hideTimer);
        if (!this.active()) {
            this.slow.set(false);
            this.slowTimer = setTimeout(() => this.slow.set(true), 8000);
            if (!this.visible()) this.showTimer = setTimeout(() => {
                if (this.active()) { this.shownAt = Date.now(); this.visible.set(true); }
            }, 300);
        }
        this.operations.update(items => [...items, { ...options, id, title: options.title || 'Please wait', message: options.message ?? 'Waiting for the server.', percentage: options.steps?.length ? 0 : null, text: '', completedSteps: 0 }]);
        let ended = false;
        return {
            update: progress => { if (!ended) this.update(id, progress); },
            end: () => { if (!ended) { ended = true; this.end(id); } },
        };
    }

    async run<T>(title: string, work: (handle: BlockUiHandle) => T | PromiseLike<T>, options: Omit<BlockUiOptions, 'title'> = {}): Promise<T> {
        const epoch = this.epoch;
        const handle = this.begin({ ...options, title });
        try { return await work(handle); }
        catch (error: unknown) { if (epoch === this.epoch) this.errors.present(error); throw error; }
        finally { handle.end(); }
    }

    private update(id: number, progress: BlockUiProgress): void {
        this.operations.update(items => items.map(item => {
            if (item.id !== id) return item;
            const steps = item.steps?.length ?? 0;
            const completed = progress.completedSteps !== undefined && Number.isInteger(progress.completedSteps) && progress.completedSteps >= 0 && progress.completedSteps <= steps ? progress.completedSteps : item.completedSteps;
            const candidate = progress.percentage !== undefined ? progress.percentage : progress.completedSteps !== undefined && steps > 0 ? completed / steps * 100 : item.percentage;
            return { ...item, completedSteps: completed, text: progress.text ?? item.text, percentage: candidate !== null && Number.isFinite(candidate) && candidate >= 0 && candidate <= 100 ? candidate : null };
        }));
    }
    private end(id: number): void {
        if (!this.operations().some(item => item.id === id)) return;
        this.retained.set(this.current());
        this.operations.update(items => items.filter(item => item.id !== id));
        if (this.active()) return;
        clearTimeout(this.showTimer); clearTimeout(this.slowTimer);
        if (!this.visible()) { this.retained.set(null); this.slow.set(false); return; }
        this.hideTimer = setTimeout(() => {
            if (!this.active()) { this.visible.set(false); this.retained.set(null); this.slow.set(false); }
        }, Math.max(0, 400 - (Date.now() - this.shownAt)));
    }
    reset(): void {
        this.epoch++; clearTimeout(this.showTimer); clearTimeout(this.hideTimer); clearTimeout(this.slowTimer);
        this.operations.set([]); this.retained.set(null); this.visible.set(false); this.slow.set(false);
    }
    ngOnDestroy(): void { this.reset(); }
}
