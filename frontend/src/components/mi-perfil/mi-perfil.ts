import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { PublicacionesService } from '../../services/publicaciones';
import { TarjetaPublicacionComponent } from '../tarjeta-publicacion/tarjeta-publicacion';
import { Publicacion } from '../../models/publicacion';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, TarjetaPublicacionComponent],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfilComponent implements OnInit {
  private auth = inject(AuthService);
  private publicacionesService = inject(PublicacionesService);

  cargando = signal(true);
  publicaciones = signal<Publicacion[]>([]);
  subiendoFoto = signal(false);

  // El usuario ya está en memoria en el AuthService — no hace falta otra llamada al backend
  usuario = computed<Usuario | null>(() => this.auth.user());

  // Si no tiene foto, generamos un avatar con sus iniciales
  avatarFallback = computed(() => {
    const u = this.usuario();
    const nombre = u ? `${u.nombre}+${u.apellido}` : 'U';
    return `https://ui-avatars.com/api/?name=${nombre}&background=6366f1&color=fff&size=200`;
  });

  badgeColor = computed(() =>
    this.usuario()?.perfil === 'administrador' ? 'badge-admin' : 'badge-usuario'
  );

  async ngOnInit() {
    // Esperamos a que la sesión esté verificada antes de cargar datos
    await this.auth.sessionReady;
    await this.cargarMisPublicaciones();
    this.cargando.set(false);
  }

  async cargarMisPublicaciones() {
    const miId = this.auth.user()?._id;
    if (!miId) return;
    try {
      // offset:0, limit:3, orden:fecha, filtro por miId → las últimas 3 del usuario
      const res = await this.publicacionesService.listar(0, 3, 'fecha', miId);
      this.publicaciones.set(res.datos || []);
    } catch (error) {
      console.error('Error al cargar mis publicaciones:', error);
    }
  }

  async onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    this.subiendoFoto.set(true);

    try {
      const formData = new FormData();
      formData.append('file', archivo);

      // Acá llamamos al método del AuthService. Asegurate de tenerlo creado
      // para que golpee a tu endpoint de NestJS.
      await this.auth.actualizarFotoPerfil(formData);

    } catch (error) {
      console.error('Error al subir la nueva foto:', error);
    } finally {
      this.subiendoFoto.set(false);
      input.value = ''; // Limpiamos el input para permitir subir la misma foto si hubo un error
    }
  }
  // Mismo patrón de actualización optimista que en publicaciones.ts
  async toggleLike(id: string) {
    const pub = this.publicaciones().find(p => p._id === id);
    if (!pub) return;

    const miId = this.auth.user()?._id ?? '';
    const yaLeDiLike = pub.likes.some((l: any) => l.toString() === miId || l === miId);

    this.publicaciones.update(lista =>
      lista.map(p => {
        if (p._id !== id) return p;
        const likes = yaLeDiLike
          ? p.likes.filter((l: any) => l.toString() !== miId)
          : [...p.likes, miId];
        return { ...p, likes };
      })
    );

    try {
      yaLeDiLike
        ? await this.publicacionesService.quitarLike(id)
        : await this.publicacionesService.darLike(id);
    } catch {
      await this.cargarMisPublicaciones();
    }
  }

  async eliminar(id: string) {
    try {
      await this.publicacionesService.eliminar(id);
      this.publicaciones.update(lista => lista.filter(p => p._id !== id));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  }
}