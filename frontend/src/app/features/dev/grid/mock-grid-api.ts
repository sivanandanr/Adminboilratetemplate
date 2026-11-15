import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, defer, finalize, map, throwError, timer } from 'rxjs';
import { AuthFacade } from '../../../core/auth/auth.facade';
import { ClientGridDataSource } from '../../../shared/grid/grid-data-source';
import { GridRequest, validateGridRequest } from '../../../shared/grid/grid.models';
import { DemoDataset, DemoGridRecord, createGridFixtures, demoDatasets, demoGridCapabilities, demoGridColumns } from './grid-fixtures';
@Injectable({ providedIn: 'root' })
export class MockGridApi {
    readonly scenario = signal<'normal' | 'error' | 'empty' | 'loading' | 'unknown'>('normal');
    readonly requests = signal(0);
    readonly cancellations = signal(0);
    private readonly datasets = new Map<DemoDataset, DemoGridRecord[]>();
    rows(dataset: DemoDataset): DemoGridRecord[] { let rows = this.datasets.get(dataset); if (!rows) {
        rows = createGridFixtures(dataset);
        this.datasets.set(dataset, rows);
    } return rows; }
    deactivate(dataset: DemoDataset, ids: readonly string[]): void { const rows = this.rows(dataset); for (let index = 0; index < rows.length; index++)
        if (ids.includes(rows[index].id))
            rows[index] = { ...rows[index], status: 'Inactive' }; }
    respond(dataset: DemoDataset, body: unknown): Observable<HttpResponse<unknown>> { return defer(() => { this.requests.update(value => value + 1); const scenario = this.scenario(); let completed = false; return timer(scenario === 'loading' ? 60000 : typeof body === 'object' && body && 'searchText' in body && (body as GridRequest).searchText === 'slow' ? 900 : 120).pipe(map(() => { if (scenario === 'error')
        throw new HttpErrorResponse({ status: 503, error: { message: 'PRIVATE_GRID_SERVER_DETAIL' } }); const request = body as GridRequest; try {
        validateGridRequest(request, demoGridCapabilities);
    }
    catch {
        throw new HttpErrorResponse({ status: 400 });
    } const source = new ClientGridDataSource(scenario === 'empty' ? [] : this.rows(dataset), demoGridColumns, demoGridCapabilities); const filtered = source.filteredRows(request); const start = (request.pageNumber - 1) * request.pageSize; completed = true; return new HttpResponse({ status: 200, body: { items: filtered.slice(start, start + request.pageSize), totalCount: scenario === 'unknown' ? null : filtered.length, pageNumber: request.pageNumber, pageSize: request.pageSize, hasNextPage: start + request.pageSize < filtered.length } }); }), finalize(() => { if (!completed)
        this.cancellations.update(value => value + 1); })); }); }
}
/** Development-only mock backend reached through HttpClient and the real request interceptors. */
export const MockGridHttpInterceptor: HttpInterceptorFn = (request, next) => { const match = /^\/api\/dev\/grid\/([^/]+)\/search$/.exec(request.url); if (!match)
    return next(request); if (!inject(AuthFacade).isAuthenticated())
    return throwError(() => new HttpErrorResponse({ status: 401 })); if (request.method !== 'POST' || !demoDatasets.includes(match[1] as DemoDataset))
    return throwError(() => new HttpErrorResponse({ status: 400 })); return inject(MockGridApi).respond(match[1] as DemoDataset, request.body); };
