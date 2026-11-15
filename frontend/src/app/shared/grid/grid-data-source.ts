import { HttpClient } from '@angular/common/http';
import { Observable, defer, map, of } from 'rxjs';
import { GridCapabilities, GridColumn, GridDataSource, GridFilter, GridPage, GridRequest, GridValue, validateGridPage, validateGridRequest } from './grid.models';
function comparable(value: GridValue): string | number { return value instanceof Date ? value.getTime() : typeof value === 'number' ? value : String(value ?? '').toLocaleLowerCase(); }
function matches(value: GridValue, filter: GridFilter): boolean { const expected = filter.value; const target = value instanceof Date && typeof expected === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expected) ? value.toISOString().slice(0, 10) : comparable(value); if (filter.operator === 'in')
    return Array.isArray(expected) && expected.includes(String(value ?? '')); if (Array.isArray(expected))
    return false; const right = typeof target === 'number' ? Number(expected) : String(expected).toLocaleLowerCase(); switch (filter.operator) {
    case 'contains': return String(target).includes(String(right));
    case 'equals': return target === right;
    case 'gte': return target >= right;
    case 'lte': return target <= right;
} }
/** Query the whole bounded client dataset before slicing a page. No AG enterprise model. */
export class ClientGridDataSource<T> implements GridDataSource<T> {
    readonly mode = 'client' as const;
    constructor(private readonly rows: readonly T[], private readonly columns: readonly GridColumn<T>[], readonly capabilities: GridCapabilities) { }
    filteredRows(request: GridRequest): readonly T[] { validateGridRequest(request, this.capabilities); const columns = new Map(this.columns.map(column => [column.id, column])); const search = request.searchText.trim().toLocaleLowerCase(); return this.rows.map((row, index) => ({ row, index })).filter(({ row }) => (!search || this.columns.some(column => column.searchable !== false && (column.value(row) instanceof Date ? (column.value(row) as Date).toISOString() : String(column.value(row) ?? '')).toLocaleLowerCase().includes(search))) && request.filters.every(filter => { const column = columns.get(filter.field); return !!column && matches(column.value(row), filter); })).sort((a, b) => { for (const sort of request.sorts) {
        const column = columns.get(sort.field);
        if (!column)
            continue;
        const left = comparable(column.value(a.row)), right = comparable(column.value(b.row));
        const difference = left < right ? -1 : left > right ? 1 : 0;
        if (difference)
            return sort.direction === 'asc' ? difference : -difference;
    } return a.index - b.index; }).map(item => item.row); }
    load(request: GridRequest): Observable<GridPage<T>> { return defer(() => { const rows = this.filteredRows(request); const start = (request.pageNumber - 1) * request.pageSize; return of({ items: rows.slice(start, start + request.pageSize), totalCount: rows.length, pageNumber: request.pageNumber, pageSize: request.pageSize }); }); }
}
/** The consumer supplies a same-origin endpoint, backend capabilities and an unknown-item decoder. */
export class ServerGridDataSource<T> implements GridDataSource<T> {
    readonly mode = 'server' as const;
    constructor(private readonly http: HttpClient, private readonly endpoint: string, readonly capabilities: GridCapabilities, private readonly decode: (value: unknown) => T) { if (!endpoint.startsWith('/') || endpoint.startsWith('//') || endpoint.includes('\\'))
        throw new Error('A same-origin API path is required'); }
    load(request: GridRequest): Observable<GridPage<T>> { return defer(() => { validateGridRequest(request, this.capabilities); return this.http.post<unknown>(this.endpoint, request).pipe(map(value => { if (!value || typeof value !== 'object')
        throw new Error('Invalid page response'); const page = value as Record<string, unknown>; if (!Array.isArray(page['items']))
        throw new Error('Invalid page items'); return validateGridPage({ items: page['items'].map(this.decode), totalCount: page['totalCount'] as number | null, pageNumber: page['pageNumber'] as number, pageSize: page['pageSize'] as number, hasNextPage: page['hasNextPage'] as boolean | undefined }, request); })); }); }
}
