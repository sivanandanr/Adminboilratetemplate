import { Injectable, inject, signal } from '@angular/core';
import { Observable, defer, delay, of } from 'rxjs';
import { ExportJob, ExportJobDownload, ExportJobProvider, ExportJobRequest } from '../../../shared/grid/export-jobs';
import { GridExportService } from '../../../shared/grid/grid-export.service';
import { ClientGridDataSource } from '../../../shared/grid/grid-data-source';
import { DemoDataset, demoDatasets, demoGridCapabilities, createGridFixtures, demoGridColumns } from './grid-fixtures';
@Injectable()
export class MockExportJobProvider implements ExportJobProvider {
    readonly scenario = signal<'normal' | 'failed' | 'expired' | 'unknown'>('normal');
    private sequence = 0;
    private readonly jobs = new Map<string, {
        job: ExportJob;
        units: number;
        request: ExportJobRequest;
    }>();
    private readonly exports = inject(GridExportService);
    start(request: ExportJobRequest): Observable<ExportJob> { return defer(() => { if (!demoDatasets.includes(request.resource as DemoDataset) || !request.columnIds.length || request.columnIds.some(id => !demoGridColumns.some(column => column.id === id && column.export?.allowed)))
        throw new Error('Unapproved mock export fields'); const job: ExportJob = { id: `mock-job-${++this.sequence}`, status: 'queued', percentage: null, canCancel: true }; this.jobs.set(job.id, { job, units: 0, request }); return of(job); }).pipe(delay(100)); }
    status(id: string): Observable<ExportJob> { return defer(() => { const item = this.jobs.get(id); if (!item)
        throw new Error('Unknown mock job'); if (item.job.status === 'queued' || item.job.status === 'running') {
        item.units++;
        item.job = { ...item.job, status: item.units < 3 ? 'running' : this.scenario() === 'failed' ? 'failed' : this.scenario() === 'expired' ? 'expired' : 'completed', percentage: this.scenario() === 'unknown' ? null : item.units / 3 * 100, canCancel: item.units < 3, expiresAt: item.units >= 3 ? Date.now() + (this.scenario() === 'expired' ? -1 : 60000) : undefined };
    } return of(item.job); }).pipe(delay(80)); }
    cancel(id: string): Observable<ExportJob> { return defer(() => { const item = this.jobs.get(id); if (!item || !item.job.canCancel)
        throw new Error('Job cannot be cancelled'); item.job = { ...item.job, status: 'cancelled', canCancel: false }; return of(item.job); }).pipe(delay(80)); }
    download(id: string): Observable<ExportJobDownload> { return defer(async () => { const item = this.jobs.get(id); if (!item || item.job.status !== 'completed' || !item.job.expiresAt || item.job.expiresAt <= Date.now())
        throw new Error('Mock file expired'); const sheet = { name: 'Export job sample', rows: new ClientGridDataSource(createGridFixtures(item.request.resource as DemoDataset), demoGridColumns, demoGridCapabilities).filteredRows(item.request.query).slice(0, 10), columns: demoGridColumns, columnIds: item.request.columnIds }; const blob = item.request.format === 'xlsx' ? await this.exports.xlsx([sheet]) : this.exports.csv(sheet); return { blob, filename: 'mock-export-job-sample', expiresAt: item.job.expiresAt }; }); }
}
