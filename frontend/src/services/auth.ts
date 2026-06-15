import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Usuario, RespuestaLogin } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Asegurate de que este prefijo coincida con tu controller en NestJS
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private readonly TOKEN_KEY = 'rs_token';
  private readonly USUARIO_KEY = 'rs_usuario';

  // ── Signals de estado (Mantenidos intactos) ──────────────────
  user = signal<Usuario | null>(this.cargarUsuarioLocal());
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  // computed() — valores derivados que se recalculan solos
  isAuthenticated = computed(() => this.user() !== null);
  
  // MODIFICACIÓN: Se agregó el espacio entre nombre y apellido
  nombreCompleto = computed(() =>
    this.user() ? `${this.user()!.nombre} ${this.user()!.apellido}` : 'Usuario',
  );
  
  // MODIFICACIÓN CRÍTICA: El TP pide que el atributo se llame "perfil", no "rol"
  esAdmin = computed(() => this.user()?.perfil === 'administrador');
  
  errorMensaje = signal('');

  sessionReady: Promise<void>;

  constructor() {
    this.sessionReady = this.inicializarSesion();
  }

  private async inicializarSesion(): Promise<void> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const usuarioJson = localStorage.getItem(this.USUARIO_KEY);
    if (token && usuarioJson) {
      this._token.set(token);
      this.user.set(JSON.parse(usuarioJson));
    }
  }

  // ── Métodos de autenticación ──────────────────────────────────────────────
  async login(identificador: string, password: string): Promise<boolean> {
    try {
      const respuesta = await firstValueFrom(
        this.http.post<RespuestaLogin>(`${this.API_URL}/login`, { identificador, password }),
      );
      localStorage.setItem(this.TOKEN_KEY, respuesta.token);
      localStorage.setItem(this.USUARIO_KEY, JSON.stringify(respuesta.usuario));
      
      this._token.set(respuesta.token);
      this.user.set(respuesta.usuario as Usuario);
      this.errorMensaje.set('');
      return true;
    } catch (err: any) {
      const msg =
        err.status === 401 ? 'Credenciales inválidas.' : 'Error al iniciar sesión.';
      this.errorMensaje.set(msg);
      return false;
    }
  }

  async registro(formData: FormData): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.API_URL}/registro`, formData));
      return true;
    } catch (err: any) {
      // Manejo de errores que pueda escupir NestJS (ej: BadRequest con array de validaciones)
      const msg = err.error?.message || 'Error al registrarse.';
      this.errorMensaje.set(Array.isArray(msg) ? msg.join(', ') : msg);
      return false;
    }
  }

  obtenerToken(): string | null {
    return this._token();
  }

  cerrarSesion() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USUARIO_KEY);
    this._token.set(null);
    this.user.set(null);
    this.router.navigate(['/login']); // Redirección limpia al login
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