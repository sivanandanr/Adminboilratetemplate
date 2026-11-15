import { ChangeDetectionStrategy, Component, Injectable, OnDestroy, effect, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, exhaustMap, map, takeWhile, timer, switchMap, tap } from 'rxjs';
import { AUTH_CONFIG } from '../../core/auth/auth.config';
import { ErrorPresenter } from '../../core/feedback/error-presenter';
import { GridRequest } from './grid.models';
import { exportFilename } from './grid-export.service';
import { SmartButton } from '../ui/actions';
import { SmartProgressBar } from '../ui/progress';
import { TaskOptions, TaskService, TaskSnapshot } from '../../core/feedback/tasks.service';
import { requestFeedback } from '../../core/feedback/request-feedback-context';
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
    private readonly context = requestFeedback({ mode: 'background', errorToast: false });
    start(request: ExportJobRequest): Observable<ExportJob> { return this.http.post<unknown>(this.base, request, { context: this.context }).pipe(map(parseExportJob)); }
    status(id: string): Observable<ExportJob> { return this.http.get<unknown>(this.path(id), { context: this.context }).pipe(map(parseExportJob)); }
    cancel(id: string): Observable<ExportJob> { return this.http.post<unknown>(this.path(id) + '/cancel', {}, { context: this.context }).pipe(map(parseExportJob)); }
    download(id: string): Observable<ExportJobDownload> { const file = this.path(id) + '/file'; return this.http.get<unknown>(this.path(id) + '/download', { context: this.context }).pipe(map(value => { if (!value || typeof value !== 'object')
        throw new Error('Invalid download'); const data = value as Record<string, unknown>; if (data['url'] !== file || typeof data['filename'] !== 'string' || typeof data['expiresAt'] !== 'number' || !Number.isFinite(data['expiresAt']) || data['expiresAt'] <= Date.now())
        throw new Error('Download unavailable'); return { url: file, filename: data['filename'], expiresAt: data['expiresAt'] }; })); }
    private path(id: string): string { if (!/^[-A-Za-z0-9_]{1,200}$/.test(id))
        throw new Error('Invalid job ID'); return this.base + '/' + encodeURIComponent(id); }
}
/** Adapter keeps existing export provider contracts while root TaskService owns monitoring. */
function exportTask(provider: ExportJobProvider, initial: ExportJob, request: ExportJobRequest, pollingMs: number) {
    const latest = signal(initial);
    const title = `Exporting ${request.resource}`;
    const snapshot = (job: ExportJob): TaskSnapshot => ({ id: `export-${initial.id}`, title,
        status: job.status === 'queued' || job.status === 'running' ? 'running' : job.status === 'completed' ? 'completed' : job.status === 'cancelled' ? 'cancelled' : 'failed',
        percentage: job.percentage, canCancel: job.canCancel, canDownload: job.status === 'completed', canRetry: true,
        message: job.status === 'expired' ? 'The export file has expired. Request a new job.' : job.status === 'failed' ? 'The backend export failed. Check the outcome before retrying.' : undefined });
    const publish = (job: ExportJob) => { latest.set(job); return snapshot(job); };
    const watch = () => timer(0, Math.max(250, pollingMs)).pipe(exhaustMap(() => provider.status(latest().id)), map(parseExportJob), map(publish), takeWhile(job => job.status === 'running', true));
    const options: TaskOptions = { id: `export-${initial.id}`, title, initial: snapshot(initial), monitoring: true,
        run: watch, cancel: () => provider.cancel(latest().id).pipe(map(parseExportJob), map(publish)),
        download: () => provider.download(latest().id).pipe(map(file => ({ ...file, filename: exportFilename(file.filename, request.format) }))),
        retry: () => provider.start(request).pipe(map(parseExportJob), tap(job => latest.set(job)), switchMap(watch)),
    };
    return { latest, options };
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
    private readonly tasks = inject(TaskService);
    private readonly current = signal<ReturnType<typeof exportTask> | null>(null);
    private command?: Subscription;
    private destroyed = false;
    constructor() { effect(() => {
        const current = this.current();
        if (current) {
            this.job.set(current.latest());
            this.failure.set(this.tasks.items().find(task => task.id === current.options.id)?.message ?? '');
        }
    }); }
    progressStatus(): 'running' | 'success' | 'error' | 'cancelled' { const status = this.job()?.status; return status === 'completed' ? 'success' : status === 'cancelled' ? 'cancelled' : status === 'failed' || status === 'expired' ? 'error' : 'running'; }
    active(): boolean { return this.job()?.status === 'queued' || this.job()?.status === 'running'; }
    start(): void {
        if (this.busy() || this.active()) return;
        this.busy.set(true); this.failure.set('');
        this.command = this.provider().start(this.request()).pipe(map(parseExportJob)).subscribe({ next: job => {
            if (this.destroyed) return;
            const current = exportTask(this.provider(), job, this.request(), this.pollingMs());
            this.tasks.start(current.options); this.current.set(current); this.job.set(job); this.busy.set(false);
        }, error: (error: unknown) => { if (!this.destroyed) { this.failure.set(this.errors.describe(error).message); this.busy.set(false); } } });
    }
    poll(): void { const id = this.current()?.options.id; if (id) this.tasks.retry(id); }
    cancel(): void { const id = this.current()?.options.id; if (id) void this.tasks.cancel(id); }
    download(): void { const id = this.current()?.options.id; if (id) void this.tasks.download(id); }
    ngOnDestroy(): void { this.destroyed = true; this.command?.unsubscribe(); }
}
