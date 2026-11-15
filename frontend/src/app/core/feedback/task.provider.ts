import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, concat, exhaustMap, map, of, switchMap, takeWhile, timer } from 'rxjs';
import { BackgroundTaskProvider, TaskDownload, TaskSnapshot, TaskState } from './tasks.service';
import { requestFeedback } from './request-feedback-context';

export interface TaskApiConfig { readonly endpoint: string | null; readonly pollingMs: number; }
/** Supply an application-relative server endpoint once its task contract is implemented. */
export const TASK_API_CONFIG = new InjectionToken<TaskApiConfig>('TASK_API_CONFIG', { providedIn: 'root', factory: () => ({ endpoint: null, pollingMs: 1000 }) });

export function parseTaskSnapshot(value: unknown): TaskSnapshot {
    if (!value || typeof value !== 'object') throw new Error('Invalid task');
    const task = value as Record<string, unknown>;
    if (typeof task['id'] !== 'string' || !/^[-A-Za-z0-9_]{1,200}$/.test(task['id']) || typeof task['title'] !== 'string' || !task['title'].length || task['title'].length > 160 || !['running', 'completed', 'failed', 'cancelled'].includes(String(task['status']))) throw new Error('Invalid task identity');
    for (const name of ['percentage', 'completed', 'total', 'etaSeconds']) {
        const number = task[name];
        if (number !== undefined && number !== null && (typeof number !== 'number' || !Number.isFinite(number) || number < 0 || name === 'percentage' && number > 100)) throw new Error('Invalid task progress');
    }
    if (typeof task['completed'] === 'number' && typeof task['total'] === 'number' && task['completed'] > task['total']) throw new Error('Invalid task counts');
    for (const name of ['canCancel', 'canDownload', 'canRetry']) if (task[name] !== undefined && typeof task[name] !== 'boolean') throw new Error('Invalid task capability');
    if (task['unit'] !== undefined && (typeof task['unit'] !== 'string' || task['unit'].length > 40) || task['message'] !== undefined && (typeof task['message'] !== 'string' || task['message'].length > 600)) throw new Error('Invalid task copy');
    return { id: task['id'], title: task['title'], status: task['status'] as TaskState,
        percentage: task['percentage'] as number | null | undefined, completed: task['completed'] as number | null | undefined,
        total: task['total'] as number | null | undefined, etaSeconds: task['etaSeconds'] as number | null | undefined,
        unit: task['unit'] as string | undefined, message: task['message'] as string | undefined,
        canCancel: task['canCancel'] as boolean | undefined, canDownload: task['canDownload'] as boolean | undefined, canRetry: task['canRetry'] as boolean | undefined };
}

@Injectable({ providedIn: 'root' })
export class ApiTaskProvider implements BackgroundTaskProvider {
    private readonly http = inject(HttpClient);
    private readonly config = inject(TASK_API_CONFIG);
    readonly available = this.config.endpoint !== null;
    private readonly context = requestFeedback({ mode: 'background', errorToast: false });
    private base(): string {
        if (!this.config.endpoint || !/^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(this.config.endpoint)) throw new Error('Configure a same-origin task endpoint');
        return this.config.endpoint.replace(/\/$/, '');
    }
    private path(id: string): string { if (!/^[-A-Za-z0-9_]{1,200}$/.test(id)) throw new Error('Invalid task ID'); return `${this.base()}/${encodeURIComponent(id)}`; }
    list(): Observable<readonly TaskSnapshot[]> {
        if (!this.available) return of([]);
        return this.http.get<unknown>(this.base(), { context: this.context }).pipe(map(value => {
            if (!Array.isArray(value) || value.length > 50) throw new Error('Invalid task list');
            return value.map(parseTaskSnapshot);
        }));
    }
    watch(id: string): Observable<TaskSnapshot> {
        return timer(0, Math.max(500, this.config.pollingMs)).pipe(exhaustMap(() => this.http.get<unknown>(this.path(id), { context: this.context })), map(parseTaskSnapshot), takeWhile(task => task.status === 'running', true));
    }
    cancel(id: string): Observable<TaskSnapshot> { return this.http.post<unknown>(this.path(id) + '/cancel', {}, { context: this.context }).pipe(map(parseTaskSnapshot)); }
    retry(id: string): Observable<TaskSnapshot> {
        return this.http.post<unknown>(this.path(id) + '/retry', {}, { context: this.context }).pipe(map(parseTaskSnapshot), switchMap(task => concat(of(task), task.status === 'running' ? this.watch(task.id) : EMPTY)));
    }
    download(id: string): Observable<TaskDownload> {
        return this.http.get<unknown>(this.path(id) + '/download', { context: this.context }).pipe(map(value => {
            if (!value || typeof value !== 'object') throw new Error('Invalid download');
            const file = value as Record<string, unknown>;
            if (typeof file['filename'] !== 'string' || !file['filename'].length || file['filename'].length > 120 || typeof file['url'] !== 'string' || typeof file['expiresAt'] !== 'number') throw new Error('Invalid download metadata');
            return { filename: file['filename'], url: file['url'], expiresAt: file['expiresAt'] };
        }));
    }
}
