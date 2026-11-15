import { ChangeDetectionStrategy, Component, Injectable, OnDestroy, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, exhaustMap, map, takeWhile, timer } from 'rxjs';
import { ApiError } from '../../core/auth/api-error';
import { AUTH_CONFIG } from '../../core/auth/auth.config';
import { ErrorPresenter } from '../../core/feedback/error-presenter';
import { GridRequest } from './grid.models';
import { GridExportService, exportFilename } from './grid-export.service';
import { SmartButton } from '../ui/actions';
import { SmartProgressBar } from '../ui/progress';
export type ExportJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'expired';
export interface ExportJobRequest {
    readonly resource: string;
    readonly format: 'csv' | 'xlsx';
    readonly columnIds: readonly string[];
    readonly query: GridRequest;
}
export interface ExportJob {
    readonly id: string;
    readonly status: ExportJobStatus;
    readonly percentage: number | null;
    readonly canCancel: boolean;
    readonly expiresAt?: number;
}
export interface ExportJobDownload {
    readonly filename: string;
    readonly expiresAt: number;
    readonly url?: string;
    readonly blob?: Blob;
}
export interface ExportJobProvider {
    start(request: ExportJobRequest): Observable<ExportJob>;
    status(id: string): Observable<ExportJob>;
    cancel(id: string): Observable<ExportJob>;
    download(id: string): Observable<ExportJobDownload>;
}
export function parseExportJob(value: unknown): ExportJob { if (!value || typeof value !== 'object')
    throw new Error('Invalid export job'); const job = value as Record<string, unknown>; if (typeof job['id'] !== 'string' || !/^[-A-Za-z0-9_]{1,200}$/.test(job['id']) || !['queued', 'running', 'completed', 'failed', 'cancelled', 'expired'].includes(String(job['status'])) || typeof job['canCancel'] !== 'boolean' || !(job['percentage'] === null || (typeof job['percentage'] === 'number' && Number.isFinite(job['percentage']) && job['percentage'] >= 0 && job['percentage'] <= 100)) || (job['expiresAt'] !== undefined && (typeof job['expiresAt'] !== 'number' || !Number.isFinite(job['expiresAt']))))
    throw new Error('Invalid export job fields'); return { id: job['id'] as string, status: job['status'] as ExportJobStatus, percentage: job['percentage'] as number | null, canCancel: job['canCancel'] as boolean, expiresAt: job['expiresAt'] as number | undefined }; }
@Injectable({ providedIn: 'root' })
export class ApiExportJobProvider implements ExportJobProvider {
    private readonly http = inject(HttpClient);
    private readonly base = inject(AUTH_CONFIG).apiBase.replace(/\/$/, '') + '/exports/jobs';
    start(request: ExportJobRequest): Observable<ExportJob> { return this.http.post<unknown>(this.base, request).pipe(map(parseExportJob)); }
    status(id: string): Observable<ExportJob> { return this.http.get<unknown>(this.path(id)).pipe(map(parseExportJob)); }
    cancel(id: string): Observable<ExportJob> { return this.http.post<unknown>(this.path(id) + '/cancel', {}).pipe(map(parseExportJob)); }
    download(id: string): Observable<ExportJobDownload> { const file = this.path(id) + '/file'; return this.http.get<unknown>(this.path(id) + '/download').pipe(map(value => { if (!value || typeof value !== 'object')
        throw new Error('Invalid download'); const data = value as Record<string, unknown>; if (data['url'] !== file || typeof data['filename'] !== 'string' || typeof data['expiresAt'] !== 'number' || !Number.isFinite(data['expiresAt']) || data['expiresAt'] <= Date.now())
        throw new Error('Download unavailable'); return { url: file, filename: data['filename'], expiresAt: data['expiresAt'] }; })); }
    private path(id: string): string { if (!/^[-A-Za-z0-9_]{1,200}$/.test(id))
        throw new Error('Invalid job ID'); return this.base + '/' + encodeURIComponent(id); }
}
@Component({ selector: 'smart-grid-export-job', imports: [SmartButton, SmartProgressBar], template: `<section class="panel job" aria-label="Backend export job"><h2>Large dataset export</h2><p>Full datasets are prepared by a backend job. No full record set is fetched into the grid.</p><div class="smart-actions"><smart-button label="Request export job" [disabled]="busy() || active()" (pressed)="start()" />@if(job()?.canCancel&&active()){<smart-button label="Cancel export job" [disabled]="busy()" (pressed)="cancel()" />}@if(job()?.status==='completed'){<smart-button label="Download completed job" [disabled]="busy()" (pressed)="download()" />}</div>@if(job()){<smart-progress-bar label="Export job progress" [percentage]="job()?.status === 'completed' ? 100 : job()?.percentage ?? null" [status]="progressStatus()" [text]="job()?.status ?? ''" /><p role="status">Export job: {{ job()?.status }}</p>}@if(failure()){<p role="alert">{{ failure() }}</p>@if(active()){<smart-button label="Retry job status" [disabled]="busy()" (pressed)="poll()" />}}</section>`, styles: `.job { padding:16px; margin-top:16px; }h2 { margin-top:0; }`, changeDetection: ChangeDetectionStrategy.OnPush })
export class GridExportJobComponent implements OnDestroy {
    readonly provider = input.required<ExportJobProvider>();
    readonly request = input.required<ExportJobRequest>();
    readonly pollingMs = input(1000);
    readonly job = signal<ExportJob | null>(null);
    readonly busy = signal(false);
    readonly failure = signal('');
    private readonly errors = inject(ErrorPresenter);
    private readonly exports = inject(GridExportService);
    private subscription?: Subscription;
    private command?: Subscription;
    private version = 0;
    private format: 'csv' | 'xlsx' = 'csv';
    progressStatus(): 'running' | 'success' | 'error' | 'cancelled' { const status = this.job()?.status; return status === 'completed' ? 'success' : status === 'cancelled' ? 'cancelled' : status === 'failed' || status === 'expired' ? 'error' : 'running'; }
    active(): boolean { return this.job()?.status === 'queued' || this.job()?.status === 'running'; }
    start(): void { if (this.busy() || this.active())
        return; ++this.version; this.format = this.request().format; this.subscription?.unsubscribe(); this.busy.set(true); this.failure.set(''); const version = this.version; this.command = this.provider().start(this.request()).pipe(map(parseExportJob)).subscribe({ next: job => { if (version !== this.version)
            return; this.job.set(job); this.busy.set(false); if (this.active())
            this.poll(); }, error: (error: unknown) => { if (version !== this.version)
            return; this.failure.set(this.errors.describe(error).message); this.busy.set(false); } }); }
    poll(): void { const id = this.job()?.id; if (!id || !this.active())
        return; this.subscription?.unsubscribe(); this.failure.set(''); const version = this.version; this.subscription = timer(0, Math.max(250, this.pollingMs())).pipe(exhaustMap(() => this.provider().status(id)), map(parseExportJob), takeWhile(job => job.status === 'queued' || job.status === 'running', true)).subscribe({ next: job => { if (version !== this.version)
            return; this.job.set(job); if (job.status === 'failed')
            this.failure.set('The backend export failed. Check the outcome before requesting another job.'); if (job.status === 'expired')
            this.failure.set('The export file has expired. Request a new job.'); }, error: (error: unknown) => { if (version === this.version)
            this.failure.set(this.errors.describe(error).message); } }); }
    cancel(): void { const job = this.job(); if (!job?.canCancel || !this.active() || this.busy())
        return; this.busy.set(true); this.subscription?.unsubscribe(); const version = ++this.version; this.command = this.provider().cancel(job.id).pipe(map(parseExportJob)).subscribe({ next: job => { if (version !== this.version)
            return; this.job.set(job); this.busy.set(false); if (this.active())
            this.poll(); }, error: (error: unknown) => { if (version !== this.version)
            return; const message = this.errors.describe(error).message; this.busy.set(false); this.poll(); this.failure.set(message); } }); }
    download(): void { const job = this.job(); if (!job || job.status !== 'completed' || this.busy())
        return; this.busy.set(true); const version = this.version; this.command = this.provider().download(job.id).subscribe({ next: file => { if (version !== this.version)
            return; if (file.expiresAt <= Date.now()) {
            this.failure.set('The export file has expired. Request a new job.');
            this.job.set({ ...job, status: 'expired' });
        }
        else if (file.blob)
            this.exports.download(file.blob, exportFilename(file.filename, this.format));
        else if (file.url) {
            const url = new URL(file.url, window.location.origin);
            if (url.origin !== window.location.origin) {
                this.failure.set('The export download address is not permitted.');
            }
            else {
                const link = document.createElement('a');
                link.href = url.href;
                link.download = exportFilename(file.filename, this.format);
                link.rel = 'noopener';
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } this.busy.set(false); }, error: (error: unknown) => { if (version !== this.version)
            return; if ((error instanceof ApiError && error.status === 410) || (job.expiresAt !== undefined && job.expiresAt <= Date.now())) {
            this.job.set({ ...job, status: 'expired' });
            this.failure.set('The export file has expired. Request a new job.');
        }
        else
            this.failure.set(this.errors.describe(error).message); this.busy.set(false); } }); }
    ngOnDestroy(): void { ++this.version; this.subscription?.unsubscribe(); this.command?.unsubscribe(); }
}
