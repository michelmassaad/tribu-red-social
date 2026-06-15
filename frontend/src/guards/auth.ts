// 👤 FUENTE: src/app/guards/auth.ts de tu proyecto Tp_Sala_de_juegos
// Prácticamente igual — solo cambia authService.sessionReady:
// en tu proyecto esperaba que Supabase respondiera; acá espera que localStorage se lea
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // sessionReady espera a que el servicio inicialice el estado desde localStorage
  await authService.sessionReady;

  if (authService.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};