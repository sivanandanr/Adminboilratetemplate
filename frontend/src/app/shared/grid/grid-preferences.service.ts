import { Injectable } from '@angular/core';
export interface GridColumnPreference {
    readonly id: string;
    readonly width: number;
    readonly hidden: boolean;
}
export interface GridPreferences {
    readonly version: 1;
    readonly columns: readonly GridColumnPreference[];
    readonly pageSize: number;
}
@Injectable({ providedIn: 'root' })
export class GridPreferencesService {
    private revision = 0;
    private readonly saved = new Map<string, number>();
    private async key(scope: string, grid: string): Promise<string> { const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(scope)); return 'smartiam.grid.v1.' + Array.from(new Uint8Array(digest)).map(value => value.toString(16).padStart(2, '0')).join('') + '.' + grid.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80); }
    async load(scope: string, grid: string, allowed: readonly string[], sizes: readonly number[]): Promise<GridPreferences | null> { try {
        const raw = localStorage.getItem(await this.key(scope, grid));
        if (!raw || raw.length > 20000)
            return null;
        const value = JSON.parse(raw) as Partial<GridPreferences>;
        if (value.version !== 1 || !Array.isArray(value.columns) || !sizes.includes(value.pageSize ?? 0))
            return null;
        const columns = value.columns.filter(column => column && allowed.includes(column.id) && Number.isFinite(column.width) && column.width >= 80 && column.width <= 1200 && typeof column.hidden === 'boolean');
        if (new Set(columns.map(column => column.id)).size !== columns.length)
            return null;
        if (columns.length && columns.every(column => column.hidden))
            columns[0] = { ...columns[0], hidden: false };
        return { version: 1, columns, pageSize: value.pageSize! };
    }
    catch {
        return null;
    } }
    async save(scope: string, grid: string, value: GridPreferences): Promise<void> { const revision = ++this.revision; try {
        const key = await this.key(scope, grid);
        if ((this.saved.get(key) ?? 0) > revision)
            return;
        this.saved.set(key, revision);
        const safe: GridPreferences = { version: 1, pageSize: value.pageSize, columns: value.columns.slice(0, 100).map(column => ({ id: column.id, width: Math.max(80, Math.min(1200, Math.round(column.width))), hidden: column.hidden })) };
        localStorage.setItem(key, JSON.stringify(safe));
    }
    catch { /* Preferences are optional in restricted/quota-exceeded storage. */ } }
}
