import { ApplicationConfig, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { PreloadAllModules, provideRouter, withComponentInputBinding,
         withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { routes } from './app.routes';

// Interceptor 2 (NUEVO) — detecta respuestas 401 y redirige al login
// Un interceptor es como un "middleware" que intercepta TODOS los requests/responses
const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Token inválido o expirado → ir al login para rehacer el token
        router.navigate(['/login']);
      }
      // Re-lanza el error para que el catch del componente también lo reciba
      return throwError(() => error);
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
    ),
    // Sin archivo interceptor separado — una línea inline
    provideHttpClient(
      withFetch(),
      withInterceptors([
        (req, next) => next(req.clone({ withCredentials: true })),errorInterceptor
      ]),
    ),
  ],
};