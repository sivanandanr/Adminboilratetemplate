import { GridCapabilities, GridColumn } from '../../../shared/grid/grid.models';
export const demoDatasets = ['employees', 'applications', 'accounts', 'entitlements', 'audit-logs'] as const;
export type DemoDataset = typeof demoDatasets[number];
export interface DemoGridRecord {
    readonly id: string;
    readonly name: string;
    readonly category: string;
    readonly owner: string;
    readonly quantity: number;
    readonly created: string;
    readonly status: 'Active' | 'Inactive' | 'Locked';
    readonly internalNote: string;
}
export function createGridFixtures(dataset: DemoDataset, count = 10000): DemoGridRecord[] { const names = { employees: 'Employee', applications: 'Application', accounts: 'Account', entitlements: 'Entitlement', 'audit-logs': 'Audit event' }; return Array.from({ length: count }, (_, index) => ({ id: `${({ employees: 'EMP', applications: 'APP', accounts: 'ACC', entitlements: 'ENT', 'audit-logs': 'AUD' })[dataset]}${String(index + 1).padStart(5, '0')}`, name: `${names[dataset]} ${String(index + 1).padStart(5, '0')}`, category: ['Operations', 'Technology', 'Finance', 'Security'][index % 4], owner: `Team ${index % 10 + 1}`, quantity: index % 500, created: new Date(Date.UTC(2026, index % 10, index % 27 + 1)).toISOString().slice(0, 10), status: index % 11 === 0 ? 'Locked' : index % 4 === 0 ? 'Inactive' : 'Active', internalNote: 'GRID_DEVELOPMENT_INTERNAL_NOT_EXPORTABLE' })); }
export const demoGridColumns: readonly GridColumn<DemoGridRecord>[] = [{ id: 'id', header: 'Record ID', value: row => row.id, kind: 'text', width: 140, export: { allowed: true } }, { id: 'name', header: 'Name', value: row => row.name, kind: 'text', width: 210, export: { allowed: true } }, { id: 'category', header: 'Category', value: row => row.category, kind: 'text', width: 150, options: ['Operations', 'Technology', 'Finance', 'Security'].map(value => ({ value, label: value })), export: { allowed: true } }, { id: 'owner', header: 'Owner', value: row => row.owner, kind: 'text', width: 135, options: Array.from({ length: 10 }, (_, index) => ({ value: `Team ${index + 1}`, label: `Team ${index + 1}` })), export: { allowed: true } }, { id: 'quantity', header: 'Assignments', value: row => row.quantity, kind: 'number', width: 130, export: { allowed: true, numberFormat: '0' } }, { id: 'created', header: 'Created on', value: row => new Date(row.created + 'T00:00:00Z'), kind: 'date', width: 145, export: { allowed: true } }, { id: 'status', header: 'Status', value: row => row.status, kind: 'status', width: 130, options: ['Active', 'Inactive', 'Locked'].map(value => ({ value, label: value })), statusTone: value => value === 'Active' ? 'success' : value === 'Locked' ? 'danger' : 'neutral', export: { allowed: true } }];
export const demoGridCapabilities: GridCapabilities = { search: true, sortFields: demoGridColumns.map(column => column.id), maxPageSize: 100, filters: { id: ['contains', 'equals'], name: ['contains', 'equals'], category: ['equals', 'in'], owner: ['contains', 'in'], quantity: ['gte', 'lte', 'equals'], created: ['gte', 'lte', 'equals'], status: ['equals', 'in'] } };
export function decodeDemoRecord(value: unknown): DemoGridRecord { if (!value || typeof value !== 'object')
    throw new Error('Invalid demo row'); const row = value as Record<string, unknown>; for (const field of ['id', 'name', 'category', 'owner', 'created', 'status'])
    if (typeof row[field] !== 'string' || (row[field] as string).length > 256)
        throw new Error('Invalid demo row field'); if (typeof row['quantity'] !== 'number' || !Number.isFinite(row['quantity']) || !['Active', 'Inactive', 'Locked'].includes(row['status'] as string) || !/^\d{4}-\d{2}-\d{2}$/.test(row['created'] as string))
    throw new Error('Invalid demo row metadata'); return { id: row['id'] as string, name: row['name'] as string, category: row['category'] as string, owner: row['owner'] as string, quantity: row['quantity'], created: row['created'] as string, status: row['status'] as DemoGridRecord['status'], internalNote: '' }; }
