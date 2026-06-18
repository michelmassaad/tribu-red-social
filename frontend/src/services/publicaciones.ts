import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private apiUrl = 'http://localhost:3000/api/publicaciones';

  // Helper para inyectar el token en cada petición
  private getHeaders() {
    const token = this.authService.obtenerToken();
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  // ── CREAR (Recibe FormData porque puede tener imagen)
  async crear(formData: FormData) {
    return firstValueFrom(
      this.http.post(this.apiUrl, formData, this.getHeaders())
    );
  }

  // ── LISTAR
  async listar(offset = 0, limit = 10, ordenarPor = 'fecha', autorId?: string) {
    let url = `${this.apiUrl}?offset=${offset}&limit=${limit}&ordenarPor=${ordenarPor}`;
    if (autorId) {
      url += `&autorId=${autorId}`;
    }
    return firstValueFrom(
      this.http.get<{ datos: any[]; total: number }>(url, this.getHeaders())
    );
  }

  // ── LIKE
  async darLike(id: string) {
    return firstValueFrom(
      this.http.post(`${this.apiUrl}/${id}/like`, {}, this.getHeaders())
    );
  }

  // ── QUITAR LIKE
  async quitarLike(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}/like`, this.getHeaders())
    );
  }

  // ── ELIMINAR
  async eliminar(id: string) {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders())
    );
  }
}