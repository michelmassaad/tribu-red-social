import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth';
import { guestGuard } from '../guards/guest';

export const routes: Routes = [
  { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },

  // guestGuard → si ya estás logueado, te redirige a publicaciones
  {
    path: 'login',
    loadComponent: () => import('../components/login/login').then(m => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('../components/registro/registro').then(m => m.RegistroComponent),
    canActivate: [guestGuard],
  },

  // authGuard → si no estás logueado, te redirige al login
  {
    path: 'publicaciones',
    loadComponent: () =>
      import('../components/publicaciones/publicaciones').then(m => m.PublicacionesComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mi-perfil',
    loadComponent: () =>
      import('../components/mi-perfil/mi-perfil').then(m => m.MiPerfilComponent),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'publicaciones' },
];