import { effect, signal, untracked } from '@angular/core';
import { ErrorPresenter } from '../../core/feedback/error-presenter';
import { GridDataSource, GridPage, GridRequest, initialGridRequest, requestKey, validateGridPage } from './grid.models';
/** Component-scoped orchestration. Effect cleanup cancels prior HTTP subscriptions. */
export class GridController<T> {
    readonly source = signal<GridDataSource<T> | null>(null);
    readonly request = signal<GridRequest>(initialGridRequest);
    readonly page = signal<GridPage<T>>({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10 });
    readonly loading = signal(false);
    readonly failure = signal('');
    private readonly revision = signal(0);
    private generation = 0;
    constructor(errors: ErrorPresenter) { effect(cleanup => { const source = this.source(); const request = this.request(); this.revision(); if (!source)
        return; const generation = ++this.generation; this.loading.set(true); this.failure.set(''); const subscription = source.load(request).subscribe({ next: page => { if (generation !== this.generation)
            return; try {
            validateGridPage(page, request);
            if (page.totalCount !== null && request.pageNumber > Math.max(1, Math.ceil(page.totalCount / request.pageSize))) {
                this.request.set({ ...request, pageNumber: Math.max(1, Math.ceil(page.totalCount / request.pageSize)) });
                return;
            }
            this.page.set(page);
            this.loading.set(false);
        }
        catch {
            this.failure.set('The service returned an invalid grid response.');
            this.loading.set(false);
        } }, error: (error: unknown) => { if (generation !== this.generation)
            return; this.failure.set(errors.describe(error).message); this.loading.set(false); } }); cleanup(() => { ++this.generation; subscription.unsubscribe(); }); }); }
    change(request: GridRequest): boolean { if (requestKey(request) === requestKey(untracked(this.request)))
        return false; this.request.set(request); return true; }
    refresh(): void { this.revision.update(value => value + 1); }
}
