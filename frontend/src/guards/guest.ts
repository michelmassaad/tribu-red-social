// 👤 FUENTE: src/app/guards/guest.ts de tu proyecto Tp_Sala_de_juegos
// Copiado literal — evita que usuarios ya logueados accedan a login/registro
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.sessionReady;

  if (authService.isAuthenticated()) {
    router.navigate(['/publicaciones']);
    return false;
  }
  return true;
};