import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { AUTH_CONFIG } from './core/auth/auth.config';
import { AUTH_PROVIDER } from './core/auth/auth.models';
import { AuthFacade } from './core/auth/auth.facade';
import { AuthInterceptor } from './core/auth/auth.interceptor';
import { SessionService } from './core/auth/session.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: AUTH_CONFIG, useValue: environment.auth },
    { provide: AUTH_PROVIDER, useFactory: environment.createAuthProvider },
    provideHttpClient(withInterceptors([AuthInterceptor]), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    provideAppInitializer(() => { inject(SessionService); void inject(AuthFacade).initialize(); }),
    provideRouter(routes)
  ]
};
