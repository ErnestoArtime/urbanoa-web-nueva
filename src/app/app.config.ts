import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/api/auth.interceptor';
import { AppTitleStrategy } from './core/routing/app-title.strategy';
import { IdlePreloadingStrategy } from './core/routing/idle-preloading.strategy';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withComponentInputBinding(), withPreloading(IdlePreloadingStrategy)),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
