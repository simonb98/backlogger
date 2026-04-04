import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, RouteReuseStrategy, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { CustomRouteReuseStrategy } from './core/strategies/custom-route-reuse.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    { provide: RouteReuseStrategy, useClass: CustomRouteReuseStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAngularQuery(new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          retry: 1,
        },
      },
    })),
  ],
};
