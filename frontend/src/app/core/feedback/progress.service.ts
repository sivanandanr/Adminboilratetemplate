import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
export type ProgressStatus = 'running' | 'success' | 'error' | 'cancelled';
export interface ProgressOperation {
    readonly id: number;
    readonly label: string;
    readonly text: string;
    readonly percentage: number | null;
    readonly status: ProgressStatus;
    readonly cancel?: () => void;
}
@Injectable({ providedIn: 'root' })
export class ProgressService {
    private sequence = 0;
    private readonly operations = signal<readonly ProgressOperation[]>([]);
    readonly items = this.operations.asReadonly();
    readonly running = computed(() => this.items().filter(item => item.status === 'running'));
    begin(label: string, cancel?: () => void): number { const id = ++this.sequence; this.operations.update(items => [...items, { id, label, text: '', percentage: null, status: 'running', cancel }]); return id; }
    update(id: number, update: {
        readonly text?: string;
        readonly completed?: number;
        readonly total?: number;
        readonly percentage?: number | null;
    }): void {
        const percentage = update.completed !== undefined && update.total !== undefined && Number.isFinite(update.completed) && Number.isFinite(update.total) && update.total > 0 && update.completed >= 0 && update.completed <= update.total ? update.completed / update.total * 100 : update.percentage !== undefined && update.percentage !== null && Number.isFinite(update.percentage) && update.percentage >= 0 && update.percentage <= 100 ? update.percentage : null;
        this.operations.update(items => items.map(item => item.id === id && item.status === 'running' ? { ...item, text: update.text ?? item.text, percentage } : item));
    }
    finish(id: number, status: Exclude<ProgressStatus, 'running'>): void { this.operations.update(items => items.map(item => item.id === id && item.status === 'running' ? { ...item, status, percentage: status === 'success' ? 100 : item.percentage } : item)); }
    cancel(id: number): void { const item = this.items().find(item => item.id === id); if (!item?.cancel || item.status !== 'running')
        return; try {
        item.cancel();
        this.finish(id, 'cancelled');
    }
    catch {
        this.finish(id, 'error');
    } }
    dismiss(id: number): void { if (this.items().some(item => item.id === id && item.status === 'running'))
        return; this.operations.update(items => items.filter(item => item.id !== id)); }
    clear(): void { for (const item of this.running()) {
        try {
            item.cancel?.();
        }
        catch { /* Session cleanup must complete even if a consumer cancellation fails. */ }
    } this.operations.set([]); }
}
@Injectable({ providedIn: 'root' })
export class RouteProgress {
    readonly loading = signal(false);
    private navigationId = 0;
    constructor() { inject(Router).events.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(event => { if (event instanceof NavigationStart) {
        this.navigationId = event.id;
        this.loading.set(true);
    }
    else if ((event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) && event.id === this.navigationId)
        this.loading.set(false); }); }
}
