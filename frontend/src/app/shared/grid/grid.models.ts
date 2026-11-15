import { Observable } from 'rxjs';
import { SmartTone } from '../ui/display';
export type GridValue = string | number | boolean | Date | null | undefined;
export type GridOperator = 'contains' | 'equals' | 'in' | 'gte' | 'lte';
export type GridFilterValue = string | number | readonly string[];
export interface GridSort {
    readonly field: string;
    readonly direction: 'asc' | 'desc';
}
export interface GridFilter {
    readonly field: string;
    readonly operator: GridOperator;
    readonly value: GridFilterValue;
}
export interface GridRequest {
    readonly pageNumber: number;
    readonly pageSize: number;
    readonly sorts: readonly GridSort[];
    readonly filters: readonly GridFilter[];
    readonly searchText: string;
}
export interface GridPage<T> {
    readonly items: readonly T[];
    readonly totalCount: number | null;
    readonly pageNumber: number;
    readonly pageSize: number;
    readonly hasNextPage?: boolean;
}
export interface GridCapabilities {
    readonly search: boolean;
    readonly sortFields: readonly string[];
    readonly filters: Readonly<Record<string, readonly GridOperator[]>>;
    readonly maxPageSize: number;
}
export interface GridColumn<T> {
    readonly id: string;
    readonly header: string;
    readonly value: (row: T) => GridValue;
    readonly kind: 'text' | 'number' | 'date' | 'status';
    readonly searchable?: boolean;
    readonly width?: number;
    readonly options?: readonly {
        value: string;
        label: string;
    }[];
    readonly statusTone?: (value: string) => SmartTone;
    /** Opt-in allowlist. Omitted/false fields are never exported, even when visible. */
    readonly export?: {
        readonly allowed: boolean;
        readonly value?: (row: T) => GridValue;
        readonly numberFormat?: string;
    };
}
export interface GridAction<T> {
    readonly id: string;
    readonly label: string;
    readonly allowed?: (row: T) => boolean;
}
export interface GridDataSource<T> {
    readonly mode: 'client' | 'server';
    readonly capabilities: GridCapabilities;
    load(request: GridRequest): Observable<GridPage<T>>;
    filteredRows?(request: GridRequest): readonly T[];
}
export const initialGridRequest: GridRequest = { pageNumber: 1, pageSize: 10, sorts: [], filters: [], searchText: '' };
export function requestKey(request: GridRequest): string { return JSON.stringify(request); }
export function validateGridRequest(request: GridRequest, capabilities: GridCapabilities): void {
    if (!Number.isSafeInteger(request.pageNumber) || request.pageNumber < 1 || !Number.isSafeInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > capabilities.maxPageSize || request.searchText.length > 256 || (!capabilities.search && !!request.searchText) || request.sorts.length > 5 || request.filters.length > 20)
        throw new Error('Unsupported grid request');
    for (const sort of request.sorts)
        if (!capabilities.sortFields.includes(sort.field) || !['asc', 'desc'].includes(sort.direction))
            throw new Error('Unsupported sort');
    for (const filter of request.filters) {
        if (!capabilities.filters[filter.field]?.includes(filter.operator))
            throw new Error('Unsupported filter');
        if (filter.operator === 'in' && !Array.isArray(filter.value))
            throw new Error('A multi-value filter requires an array');
        if (Array.isArray(filter.value)) {
            if (filter.operator !== 'in' || filter.value.length > 50 || filter.value.some(value => typeof value !== 'string' || value.length > 256))
                throw new Error('Invalid filter');
        }
        else if (typeof filter.value === 'number') {
            if (!Number.isFinite(filter.value))
                throw new Error('Invalid numeric filter');
        }
        else if (typeof filter.value !== 'string' || filter.value.length > 256)
            throw new Error('Invalid filter value');
    }
}
export function validateGridPage<T>(page: GridPage<T>, request: GridRequest): GridPage<T> {
    if (!Array.isArray(page.items) || page.items.length > request.pageSize || page.pageNumber !== request.pageNumber || page.pageSize !== request.pageSize || !(page.totalCount === null || (Number.isSafeInteger(page.totalCount) && page.totalCount >= 0)) || (page.totalCount === null && typeof page.hasNextPage !== 'boolean'))
        throw new Error('Invalid grid page');
    if (page.totalCount !== null && page.items.length !== Math.max(0, Math.min(request.pageSize, page.totalCount - (request.pageNumber - 1) * request.pageSize)))
        throw new Error('Invalid total count');
    if (page.hasNextPage !== undefined && typeof page.hasNextPage !== 'boolean')
        throw new Error('Invalid next-page flag');
    return page;
}
