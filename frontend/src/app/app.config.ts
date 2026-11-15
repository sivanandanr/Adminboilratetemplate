import { ApplicationConfig, ErrorHandler, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AUTH_CONFIG } from './core/auth/auth.config';
import { AUTH_PROVIDER } from './core/auth/auth.models';
import { AuthFacade } from './core/auth/auth.facade';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { SessionService } from './core/auth/session.service';
import { NOTIFICATION_PROVIDER } from './core/notifications/notification.models';
import { ErrorPresentationInterceptor, SafeApplicationErrorHandler } from './core/feedback/error-presenter';
import { DASHBOARD_PROVIDER } from './shared/dashboard/dashboard.models';
import { RECORDS_PROVIDER } from './features/records/records.models';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: AUTH_CONFIG, useValue: environment.auth },
    { provide: AUTH_PROVIDER, useFactory: environment.createAuthProvider },
    { provide: NOTIFICATION_PROVIDER, useFactory: environment.createNotificationProvider },
    { provide: DASHBOARD_PROVIDER, useFactory: environment.createDashboardProvider },
    { provide: RECORDS_PROVIDER, useFactory: environment.createRecordsProvider },
    { provide: ErrorHandler, useClass: SafeApplicationErrorHandler },
    provideHttpClient(withInterceptors([ErrorPresentationInterceptor, AuthInterceptor, ...environment.developmentInterceptors]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    provideAppInitializer(() => { inject(SessionService); void inject(AuthFacade).initialize(); }),
    provideRouter(routes)
  ]
};
