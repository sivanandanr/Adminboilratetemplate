import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../auth/api-error';
import { ToastService } from './toast.service';
export interface PresentedError {
    readonly title: string;
    readonly message: string;
    readonly correlationId?: string;
}
@Injectable({ providedIn: 'root' })
export class ErrorPresenter {
    private readonly toasts = inject(ToastService);
    describe(error: unknown): PresentedError {
        if (error instanceof ApiError) {
            const titles = { validation: 'Validation failed', unauthorized: 'Sign-in required', forbidden: 'Access denied', network: 'Connection problem', server: 'Service unavailable', timeout: 'Operation timed out' };
            const messages = { validation: 'Check the highlighted values and try again.', unauthorized: 'Sign in again to continue.', forbidden: 'You do not have permission for this operation.', network: 'Check your connection and try again.', server: 'The service could not complete the request. Try again later.', timeout: 'The service did not respond in time. Check the result before retrying.' };
            return { title: titles[error.kind], message: messages[error.kind], correlationId: error.correlationId && /^[a-zA-Z0-9-]{1,80}$/.test(error.correlationId) ? error.correlationId : undefined };
        }
        return { title: 'Unexpected application error', message: 'The operation could not be completed. Try again or reload the page.' };
    }
    present(error: unknown): void { const value = this.describe(error); this.toasts.show({ tone: 'error', title: value.title, message: value.message + (value.correlationId ? ` Reference: ${value.correlationId}` : '') }); }
}
@Injectable()
export class SafeApplicationErrorHandler implements ErrorHandler {
    private readonly presenter = inject(ErrorPresenter);
    handleError(error: unknown): void { this.presenter.present(error); }
}
/** Opt-in global presentation; forms/providers that show inline feedback leave this false. */
export const PRESENT_API_ERROR = new HttpContextToken(() => false);
export const ErrorPresentationInterceptor: HttpInterceptorFn = (request, next) => { const presenter = inject(ErrorPresenter); return next(request).pipe(catchError((error: unknown) => { if (request.context.get(PRESENT_API_ERROR))
    presenter.present(error); return throwError(() => error); })); };
