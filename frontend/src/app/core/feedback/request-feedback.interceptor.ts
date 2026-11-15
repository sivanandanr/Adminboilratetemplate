import { HttpClient, HttpContext, HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TimeoutError, catchError, defer, finalize, firstValueFrom, tap, throwError } from 'rxjs';
import { AUTH_CONFIG, apiPath } from '../auth/auth.config';
import { ApiError } from '../auth/api-error';
import { SKIP_AUTH_EVENTS } from '../auth/bff-auth.provider';
import { BlockUiService } from './block-ui.service';
import { DataLoading } from './progress.service';
import { ErrorPresenter } from './error-presenter';
import { ConnectionService } from './connection.service';
import { REQUEST_FEEDBACK } from './request-feedback-context';
import { formatByteProgress } from './progress-format';

export const RequestFeedbackInterceptor: HttpInterceptorFn = (request, next) => {
    const config = inject(AUTH_CONFIG);
    const target = new URL(request.url, document.baseURI), base = new URL(config.apiBase, document.baseURI);
    if (target.origin !== base.origin || !(target.pathname === base.pathname || target.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/'))) return next(request);
    const blockUi = inject(BlockUiService), loading = inject(DataLoading), errors = inject(ErrorPresenter), connection = inject(ConnectionService), http = inject(HttpClient);
    const options = request.context.get(REQUEST_FEEDBACK);
    if (!options.connectionProbe) connection.setProbe(async () => {
        const context = new HttpContext().set(SKIP_AUTH_EVENTS, true).set(REQUEST_FEEDBACK, { mode: 'background', errorToast: false, connectionProbe: true });
        try { await firstValueFrom(http.get(apiPath(config, config.endpoints.session), { context })); return true; }
        catch (error: unknown) { return (error instanceof ApiError || error instanceof HttpErrorResponse) && error.status > 0; }
    });
    const read = options.mode === 'read' || ['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const background = options.mode === 'background';
    const blocking = !background && (options.blockUi ?? !read);
    return defer(() => {
        const handle = blocking ? blockUi.begin(options) : undefined;
        const endRead = !background && read && !blocking ? loading.begin() : undefined;
        const finish = () => { handle?.end(); endRead?.(); };
        return next(request.clone({ reportProgress: blocking || request.reportProgress })).pipe(
            tap(event => {
                if (event.type === HttpEventType.Response && !options.connectionProbe) connection.connected();
                if (event.type === HttpEventType.UploadProgress || event.type === HttpEventType.DownloadProgress) {
                    const total = event.total;
                    handle?.update({ percentage: total !== undefined && Number.isFinite(total) && total > 0 && event.loaded >= 0 && event.loaded <= total ? event.loaded / total * 100 : null,
                        text: total !== undefined && Number.isFinite(total) && total > 0 && event.loaded >= 0 && event.loaded <= total ? formatByteProgress(event.loaded, total) : '' });
                }
            }),
            catchError((error: unknown) => {
                finish();
                const network = error instanceof ApiError ? error.kind === 'network' : error instanceof HttpErrorResponse && error.status === 0;
                if (network && !options.connectionProbe) connection.unreachable();
                if (!background && options.errorToast !== false) {
                    const timedOut = error instanceof TimeoutError || error instanceof ApiError && error.kind === 'timeout';
                    errors.present(error, timedOut ? { title: 'Request timed out', message: "The server didn't respond. Your changes weren't saved." } : undefined);
                }
                return throwError(() => error);
            }),
            finalize(finish),
        );
    });
};
