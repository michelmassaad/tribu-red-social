import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth';
import { guestGuard } from '../guards/guest';

export const routes: Routes = [
  // { path: '', redirectTo: 'cargando', pathMatch: 'full' },

  // Sin guard porque tiene que ser accesible sin importar el estado de sesión
  {
    path: 'cargando',
    loadComponent: () =>
      import('../components/pantalla-carga/pantalla-carga').then(m => m.PantallaCargaComponent),
  },

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
    path: 'publicacion/:id',
    loadComponent: () =>
      import('../components/publicacion/publicacion').then(m => m.PublicacionComponent),
    canActivate: [authGuard],
  },
  {
    path: 'mi-perfil',
    loadComponent: () =>
      import('../components/mi-perfil/mi-perfil').then(m => m.MiPerfilComponent),
    canActivate: [authGuard],
  },

  { path: '**', redirectTo: 'cargando' },
];