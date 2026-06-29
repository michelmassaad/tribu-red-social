import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { Comentario, PaginadoComentarios } from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class ComentariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/publicaciones`;

  // ── LISTAR — trae comentarios de una publicación paginados
  // El backend los ordena por más recientes primero
  async listar(publicacionId: string, offset = 0, limit = 10) {
    return firstValueFrom(
      this.http.get<PaginadoComentarios>(
        `${this.apiUrl}/${publicacionId}/comentarios?offset=${offset}&limit=${limit}`
      )
    );
  }

  // ── AGREGAR — crea un nuevo comentario en una publicación
  async agregar(publicacionId: string, contenido: string) {
    return firstValueFrom(
      this.http.post<Comentario>(
        `${this.apiUrl}/${publicacionId}/comentarios`,
        { contenido }
      )
    );
  }

  // ── EDITAR — modifica el texto de un comentario propio
  // El backend verifica que sea el autor y pone modificado: true
  async editar(publicacionId: string, comentarioId: string, contenido: string) {
    return firstValueFrom(
      this.http.put<Comentario>(
        `${this.apiUrl}/${publicacionId}/comentarios/${comentarioId}`,
        { contenido }
      )
    );
  }
}