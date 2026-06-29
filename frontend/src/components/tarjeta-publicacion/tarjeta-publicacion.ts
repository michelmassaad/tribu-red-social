import { Component, input, output, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion, Comentario } from '../../models/publicacion';
import { AuthService } from '../../services/auth';
import { ComentariosService } from '../../services/comentarios';

@Component({
  selector: 'app-tarjeta-publicacion',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tarjeta-publicacion.html',
  styleUrl: './tarjeta-publicacion.css',
})
export class TarjetaPublicacionComponent implements OnInit {

  readonly publicacion = input.required<Publicacion>();
  readonly onToggleLike = output<string>();
  readonly onEliminar = output<string>();

  private auth = inject(AuthService);
  private comentariosService = inject(ComentariosService);

  // ── Comentarios ──────────────────────────────────────────────
  mostrarComentarios = signal(false);
  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  cargandoMas = signal(false);
  offset = 0;
  limit = 5;

  hayMas = computed(() => this.comentarios().length < this.totalComentarios());

  // ── Nuevo comentario ─────────────────────────────────────────
  nuevoComentario = signal('');
  enviando = signal(false);

  // ── Edición ──────────────────────────────────────────────────
  editandoId = signal<string | null>(null);
  textoEdicion = signal('');
  guardando = signal(false);

  // ── Likes ────────────────────────────────────────────────────
  yaLeDiLike = computed(() => {
    const miId = this.auth.user()?._id;
    return this.publicacion().likes.some(
      (l: any) => l.toString() === miId || l === miId
    );
  });

  puedoEliminar = computed(() => {
    const miId = this.auth.user()?._id;
    return this.publicacion().autor._id === miId || this.auth.esAdmin();
  });

  // Carga solo el total al iniciar para mostrar el contador correcto
  // sin traer todos los comentarios innecesariamente
  async ngOnInit() {
    try {
      const res = await this.comentariosService.listar(
        this.publicacion()._id, 0, 1 // limit=1 solo para obtener el total
      );
      this.totalComentarios.set(res.total);
    } catch {}
  }

  clickLike() { this.onToggleLike.emit(this.publicacion()._id); }
  clickEliminar() { this.onEliminar.emit(this.publicacion()._id); }

  // Al hacer click en comentarios, carga los datos la primera vez
  async toggleComentarios() {
    this.mostrarComentarios.set(!this.mostrarComentarios());
    if (this.mostrarComentarios() && this.comentarios().length === 0) {
      await this.cargarComentarios(true);
    }
  }

  async cargarComentarios(reset = true) {
    if (reset) {
      this.offset = 0;
      this.cargandoComentarios.set(true);
    } else {
      this.cargandoMas.set(true);
    }
    try {
      const res = await this.comentariosService.listar(
        this.publicacion()._id, this.offset, this.limit
      );
      if (reset) {
        this.comentarios.set(res.datos);
      } else {
        this.comentarios.update(lista => [...lista, ...res.datos]);
      }
      this.totalComentarios.set(res.total);
    } catch (e) {
      console.error('Error al cargar comentarios', e);
    } finally {
      this.cargandoComentarios.set(false);
      this.cargandoMas.set(false);
    }
  }

  cargarMas() {
    this.offset += this.limit;
    this.cargarComentarios(false);
  }

  async enviarComentario() {
    const texto = this.nuevoComentario().trim();
    if (!texto || this.enviando()) return;
    this.enviando.set(true);
    try {
      const nuevo = await this.comentariosService.agregar(
        this.publicacion()._id, texto
      );
      this.comentarios.update(lista => [nuevo as Comentario, ...lista]);
      this.totalComentarios.update(t => t + 1);
      this.nuevoComentario.set('');
    } catch (e) {
      console.error('Error al comentar', e);
    } finally {
      this.enviando.set(false);
    }
  }

  iniciarEdicion(c: Comentario) {
    this.editandoId.set(c._id);
    this.textoEdicion.set(c.contenido);
  }

  cancelarEdicion() {
    this.editandoId.set(null);
    this.textoEdicion.set('');
  }

  async guardarEdicion(comentarioId: string) {
    const texto = this.textoEdicion().trim();
    if (!texto) return;
    this.guardando.set(true);
    try {
      const actualizado = await this.comentariosService.editar(
        this.publicacion()._id, comentarioId, texto
      );
      this.comentarios.update(lista =>
        lista.map(c => c._id === comentarioId ? (actualizado as Comentario) : c)
      );
      this.cancelarEdicion();
    } catch (e) {
      console.error('Error al editar', e);
    } finally {
      this.guardando.set(false);
    }
  }

  puedoEditar(autorId: string): boolean {
    return this.auth.user()?._id === autorId;
  }
}