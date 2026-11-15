import { HttpClient, HttpContextToken } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, throwError } from 'rxjs';
import { AUTH_CONFIG, apiPath } from './auth.config';
import { AuthProvider, LoginRequest, LoginResult, ProfilePatch, safeReturnUrl } from './auth.models';
import { ApiError } from './api-error';
import { parseSession } from './session-contract';

import { requestFeedback } from '../feedback/request-feedback-context';

export const SKIP_AUTH_EVENTS = new HttpContextToken<boolean>(() => false);
@Injectable({ providedIn: 'root' })
export class BffAuthProvider implements AuthProvider {
  clearLocalSession(): void { /* No client-side BFF credential/user cache. HttpOnly cookies belong to the server. */ }
  private readonly http = inject(HttpClient);
  private readonly config = inject(AUTH_CONFIG);
  private readonly context = requestFeedback({ mode: 'background', errorToast: false }).set(SKIP_AUTH_EVENTS, true);
  session() {
    return this.http.get<unknown>(apiPath(this.config, this.config.endpoints.session), { context: this.context }).pipe(
      map((response) => response === null ? null : parseSession(response)),
      catchError((error: unknown) => error instanceof ApiError && error.status === 401 ? of(null) : throwError(() => error)),
    );
  }
  login(request: LoginRequest) {
    if (request.provider === 'entra' || request.provider === 'ad') {
      const url = `${apiPath(this.config, this.config.endpoints.challenge)}/${request.provider}?returnUrl=${encodeURIComponent(safeReturnUrl(request.returnUrl))}`;
      return of<LoginResult>({ kind: 'redirect', url });
    }
    if (request.provider !== 'local') return throwError(() => new Error('Unsupported authentication provider'));
    return this.http.post<unknown>(apiPath(this.config, this.config.endpoints.login), { username: request.username, password: request.password }, { context: requestFeedback({ title: 'Signing in', message: 'Verifying your sign-in.', errorToast: false }).set(SKIP_AUTH_EVENTS, true) }).pipe(
      map((response): LoginResult => ({ kind: 'session', session: parseSession(response) })),
    );
  }
  logout() {
    return this.http.post<void>(apiPath(this.config, this.config.endpoints.logout), {}, { context: requestFeedback({ title: 'Signing out', message: 'Ending your session.', errorToast: false }).set(SKIP_AUTH_EVENTS, true) }).pipe(
      catchError((error: unknown) => error instanceof ApiError && error.status === 401 ? of(undefined) : throwError(() => error)),
    );
  }
  renew() { return this.http.post<unknown>(apiPath(this.config, this.config.endpoints.renew), {}, { context: requestFeedback({ mode: 'background', errorToast: false }) }).pipe(map(parseSession)); }
  updateProfile(patch: ProfilePatch) { return this.http.patch<unknown>(apiPath(this.config, this.config.endpoints.profile), patch).pipe(map(parseSession)); }
}
