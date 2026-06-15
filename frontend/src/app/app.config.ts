import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
// import { jwtInterceptor } from '../interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ✅ Un solo provideRouter con todas las opciones
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withComponentInputBinding(),
      withPreloading(PreloadAllModules),
    ),
    // ✅ withInterceptors agrega el JWT automáticamente a cada request
    provideHttpClient(withFetch(),// withInterceptors([jwtInterceptor])  
    ),
  ],
};