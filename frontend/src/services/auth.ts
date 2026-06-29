import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Usuario } from '../models/usuario';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly USUARIO_KEY = 'rs_usuario';

  // Timer interno — lo guardamos para poder cancelarlo con clearTimeout
  private timerSesion: any = null;

  // Signal que controla el modal de "sesión por vencer"
  // app.html lo lee para mostrar u ocultar el modal
  mostrarModalSesion = signal(false);

  user = signal<Usuario | null>(this.cargarUsuarioLocal());
  isAuthenticated = computed(() => this.user() !== null);
  nombreCompleto = computed(() =>
    this.user() ? `${this.user()!.nombre}${this.user()!.apellido}` : 'Usuario',
  );
  esAdmin = computed(() => this.user()?.perfil === 'administrador');
  errorMensaje = signal('');

  sessionReady: Promise<void>;

  constructor() {
    this.sessionReady = this.verificarSesion();
  }

  private async verificarSesion(): Promise<void> {
    try {
      const usuario = await firstValueFrom(
        this.http.get<Usuario>(`${this.API_URL}/me`),
      );
      this.user.set(usuario);
      localStorage.setItem(this.USUARIO_KEY, JSON.stringify(usuario));
    } catch {
      this.user.set(null);
      localStorage.removeItem(this.USUARIO_KEY);
    }
  }

  async login(identificador: string, password: string): Promise<boolean> {
    try {
      const respuesta = await firstValueFrom(
        this.http.post<{ mensaje: string; usuario: Usuario }>(
          `${this.API_URL}/login`,
          { identificador, password },
        ),
      );
      localStorage.setItem(this.USUARIO_KEY, JSON.stringify(respuesta.usuario));
      this.user.set(respuesta.usuario as Usuario);
      this.errorMensaje.set('');
      this.iniciarTimerSesion(); // ← NUEVO: iniciar el contador de 10 min al loguearse
      return true;
    } catch (err: any) {
      const msg = err.status === 401 ? 'Credenciales inválidas.' : 'Error al iniciar sesión.';
      this.errorMensaje.set(msg);
      return false;
    }
  }

  async registro(formData: FormData): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/registro`, formData));
      return true;
    } catch (err: any) {
      const msg = err.error?.message || 'Error al registrarse.';
      this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg);
      return false;
    }
  }

  async cerrarSesion(): Promise<void> {
    this.detenerTimerSesion(); // ← NUEVO: limpiar el timer al cerrar sesión
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/logout`, {}));
    } catch { }
    this.user.set(null);
    localStorage.removeItem(this.USUARIO_KEY);
    this.mostrarModalSesion.set(false);

    this.router.navigate(['/login']);
  }

  // ── AUTORIZAR ── NUEVO ─────────────────────────────────────────────────
  // Lo usa la pantalla de carga para validar el token al arrancar la app.
  // Si el token es válido → devuelve el usuario y redirige a publicaciones.
  // Si no → devuelve null y redirige al login.
  async autorizar(): Promise<Usuario | null> {
    try {
      const usuario = await firstValueFrom(
        this.http.post<Usuario>(`${this.API_URL}/autorizar`, {})
      );
      this.user.set(usuario);
      localStorage.setItem(this.USUARIO_KEY, JSON.stringify(usuario));
      return usuario;
    } catch {
      this.user.set(null);
      localStorage.removeItem(this.USUARIO_KEY);
      return null;
    }
  }

  // ── REFRESCAR TOKEN ── NUEVO ──────────────────────────────────────────
  // Se llama cuando el usuario acepta extender la sesión en el modal.
  // Obtiene un nuevo token del backend y reinicia el timer de 10 minutos.
  async refrescarToken(): Promise<void> {
    // Cancelar el timer de cierre automático
    if (this.timerCierre) {
      clearTimeout(this.timerCierre);
      this.timerCierre = null;
    }
    try {
      const resultado = await firstValueFrom(
        this.http.post<{ mensaje: string; usuario: Usuario }>(
          `${this.API_URL}/refrescar`, {}
        )
      );
      this.user.set(resultado.usuario);
      localStorage.setItem(this.USUARIO_KEY, JSON.stringify(resultado.usuario));
      this.mostrarModalSesion.set(false);
      this.iniciarTimerSesion(); // reiniciar los 10 minutos desde cero
    } catch {
      await this.cerrarSesion();
    }
  }

  async actualizarFotoPerfil(formData: FormData) {

    const url = `${environment.apiUrl}/auth/me/foto`;

    try {
      // Usamos withCredentials para que Angular envíe automáticamente 
      // tu cookie 'access_token' hacia el backend.
      const data: any = await firstValueFrom(
        this.http.patch(url, formData, {
          withCredentials: true
        })
      );

      //  Actualizamos el Signal del usuario
      if (this.user && typeof this.user.set === 'function') {
        this.user.set(data.usuario);
      }

      return data;
    } catch (error) {
      console.error('Error en el servicio al subir foto:', error);
      throw error;
    }
  }

  private timerCierre: any = null; // ← nuevo timer para el cierre automático

  iniciarTimerSesion(): void {
    this.detenerTimerSesion();
    this.timerSesion = setTimeout(() => {
      this.mostrarModalSesion.set(true);

      // Cuando aparece el modal, arranca un timer de 5 minutos más
      // Si el usuario no extiende, se cierra la sesión automáticamente
      this.timerCierre = setTimeout(() => {
        this.mostrarModalSesion.set(false);
        this.cerrarSesion();
      }, 5 * 60 * 1000); // 5 minutos

    }, 10 * 60 * 1000); // 10 minutos
  }

  detenerTimerSesion(): void {
    if (this.timerSesion) {
      clearTimeout(this.timerSesion);
      this.timerSesion = null;
    }
    // También cancelar el timer de cierre si existía
    if (this.timerCierre) {
      clearTimeout(this.timerCierre);
      this.timerCierre = null;
    }
  }

  esRutaAuth(): boolean {
    return this.router.url.includes('/login') || this.router.url.includes('/registro');
  }

  private cargarUsuarioLocal(): Usuario | null {
    try {
      const datos = localStorage.getItem(this.USUARIO_KEY);
      return datos ? JSON.parse(datos) : null;
    } catch {
      return null;
    }
  }
}