import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Publicacion } from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/publicaciones`;;

  // ── CREAR (Recibe FormData porque puede tener imagen)
  async crear(formData: FormData) {
    return firstValueFrom(
      this.http.post(this.apiUrl, formData)
    );
  }

  // ── LISTAR
  async listar(offset = 0, limit = 10, ordenarPor = 'fecha', autorId?: string) {
    let url = `${this.apiUrl}?offset=${offset}&limit=${limit}&ordenarPor=${ordenarPor}`;
    if (autorId) {
      url += `&autorId=${autorId}`;
    }
    return firstValueFrom(
      this.http.get<{ datos: any[]; total: number }>(url)
    );
  }

  // ── LIKE
  async darLike(id: string) {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/${id}/like`, {})
    );
  }

  // ── QUITAR LIKE
  async quitarLike(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}/like`)
    );
  }

  // ── ELIMINAR
  async eliminar(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`)
    );
  }
  // Agregar este método al PublicacionesService existente
  async obtenerPublicacion(id: string) {
    return firstValueFrom(
      this.http.get<Publicacion>(`${this.apiUrl}/${id}`)
    );
  }
}