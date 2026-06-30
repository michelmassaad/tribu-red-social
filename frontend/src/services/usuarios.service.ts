import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Usuario } from '../models/usuario';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private statsUrl = `${environment.apiUrl}/estadisticas`;

  // ── USUARIOS ──────────────────────────────────────────────────
  async listar(): Promise<Usuario[]> {
    return firstValueFrom(this.http.get<Usuario[]>(this.apiUrl));
  }

  async crear(datos: any): Promise<any> {
    return firstValueFrom(this.http.post(this.apiUrl, datos));
  }

  async deshabilitar(id: string): Promise<any> {
    return firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
  }

  async habilitar(id: string): Promise<any> {
    return firstValueFrom(this.http.post(`${this.apiUrl}/${id}/habilitar`, {}));
  }

  // ── ESTADÍSTICAS ──────────────────────────────────────────────
  async publicacionesPorUsuario(desde: string, hasta: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(
        `${this.statsUrl}/publicaciones-por-usuario?desde=${desde}&hasta=${hasta}`
      )
    );
  }

  async comentariosPorDia(desde: string, hasta: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(
        `${this.statsUrl}/comentarios-por-dia?desde=${desde}&hasta=${hasta}`
      )
    );
  }

  async comentariosPorPublicacion(desde: string, hasta: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(
        `${this.statsUrl}/comentarios-por-publicacion?desde=${desde}&hasta=${hasta}`
      )
    );
  }
}