import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.sessionReady;

  // Si está logueado y es admin → permite acceder
  if (auth.isAuthenticated() && auth.esAdmin()) return true;

  // Si está logueado pero no es admin → vuelve al feed
  // Si no está logueado → el authGuard ya lo mandó al login
  router.navigate(['/publicaciones']);
  return false;
};