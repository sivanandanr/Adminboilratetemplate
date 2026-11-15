import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, throwError, timeout, timer } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
import { AuthFacade } from './auth.facade';
import { ApiError, ApiErrorKind } from './api-error';
import { SKIP_AUTH_EVENTS } from './bff-auth.provider';

export const AuthInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(AUTH_CONFIG); const auth = inject(AuthFacade); const router = inject(Router);
  const base = new URL(config.apiBase, window.location.origin);
  const target = new URL(request.url, window.location.origin);
  if (target.origin !== base.origin || !(target.pathname === base.pathname || target.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/'))) return next(request);
  const correlation = crypto.randomUUID();
  const authenticated = request.clone({ withCredentials: true, setHeaders: { 'X-Correlation-ID': correlation } });
  return next(authenticated).pipe(
    timeout(10_000),
    retry({ count: ['GET', 'HEAD'].includes(request.method) ? 1 : 0, delay: (error: unknown) => error instanceof HttpErrorResponse && [0, 502, 503, 504].includes(error.status) ? timer(100) : throwError(() => error) }),
    catchError((error: unknown) => {
      const status = error instanceof HttpErrorResponse ? error.status : 0;
      if (!request.context.get(SKIP_AUTH_EVENTS)) {
        if (status === 401 && auth.isAuthenticated()) auth.invalidate('expired');
        if (status === 403 && auth.isAuthenticated()) void router.navigateByUrl('/access-denied');
      }
      const kind: ApiErrorKind = status === 0 ? 'network' : status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 400 || status === 422 ? 'validation' : 'server';
      const message = { network: 'Unable to reach the service. Check your connection.', unauthorized: 'Sign-in failed or the session has expired.', forbidden: 'Access to this operation is denied.', validation: 'The service rejected the submitted values.', server: 'The service is temporarily unavailable.' }[kind];
      return throwError(() => new ApiError(status, kind, message, correlation));
    }),
  );
};
