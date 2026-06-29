import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicacionesService } from '../../services/publicaciones';
import { ComentariosService } from '../../services/comentarios';
import { AuthService } from '../../services/auth';
import { Publicacion, Comentario } from '../../models/publicacion';

@Component({
  selector: 'app-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.css',
})
export class PublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);          // para leer el :id de la URL
  private router = inject(Router);
  private publicacionesService = inject(PublicacionesService);
  private comentariosService = inject(ComentariosService);
  readonly auth = inject(AuthService);

  // ── Estado de la publicación ────────────────────────────────────────────
  publicacion = signal<Publicacion | null>(null);
  cargando = signal(true);

  // Computed: sabe si el usuario logueado ya dio like
  yaLeDiLike = computed(() => {
    const miId = this.auth.user()?._id;
    return this.publicacion()?.likes.some(
      (l: any) => l.toString() === miId || l === miId
    ) ?? false;
  });

  puedoEliminar = computed(() => {
    const miId = this.auth.user()?._id;
    return this.publicacion()?.autor._id === miId || this.auth.esAdmin();
  });

  // ── Estado de comentarios ───────────────────────────────────────────────
  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  cargandoComentarios = signal(false);
  cargandoMasComentarios = signal(false);
  offsetComentarios = signal(0);
  limitComentarios = 5; // cantidad de comentarios por página

  // true cuando hay más comentarios para cargar
  hayMasComentarios = computed(() =>
    this.comentarios().length < this.totalComentarios()
  );

  // ── Formulario de nuevo comentario ──────────────────────────────────────
  nuevoComentario = signal('');
  enviandoComentario = signal(false);

  // ── Edición de comentario ───────────────────────────────────────────────
  comentarioEditandoId = signal<string | null>(null); // null = ninguno en edición
  textoEdicion = signal('');
  guardandoEdicion = signal(false);

  async ngOnInit() {
    await this.auth.sessionReady;
    const id = this.route.snapshot.paramMap.get('id'); // leer el :id de la URL
    if (!id) { this.router.navigate(['/publicaciones']); return; }

    await this.cargarPublicacion(id);
    await this.cargarComentarios(true);
    this.cargando.set(false);
  }

  async cargarPublicacion(id: string) {
    try {
      const res = await this.publicacionesService.obtenerPublicacion(id);
      this.publicacion.set(res);
    } catch {
      this.router.navigate(['/publicaciones']); // si no existe → volver al feed
    }
  }

  // ── Carga comentarios con paginación ─────────────────────────────────────
  // reset=true → primera carga (reemplaza la lista)
  // reset=false → "cargar más" (agrega al final de la lista)
  async cargarComentarios(reset = true) {
    const id = this.publicacion()?._id;
    if (!id) return;

    reset ? this.cargandoComentarios.set(true) : this.cargandoMasComentarios.set(true);

    try {
      const res = await this.comentariosService.listar(
        id, this.offsetComentarios(), this.limitComentarios
      );
      if (reset) {
        this.comentarios.set(res.datos);
      } else {
        this.comentarios.update(actual => [...actual, ...res.datos]);
      }
      this.totalComentarios.set(res.total);
    } catch (error) {
      console.error('Error al cargar comentarios', error);
    } finally {
      this.cargandoComentarios.set(false);
      this.cargandoMasComentarios.set(false);
    }
  }

  cargarMasComentarios() {
    this.offsetComentarios.update(v => v + this.limitComentarios);
    this.cargarComentarios(false);
  }

  // ── Enviar nuevo comentario ─────────────────────────────────────────────
  async enviarComentario() {
    const texto = this.nuevoComentario().trim();
    const id = this.publicacion()?._id;
    if (!texto || !id || this.enviandoComentario()) return;

    this.enviandoComentario.set(true);
    try {
      const nuevo = await this.comentariosService.agregar(id, texto);
      // Agrega el comentario nuevo al inicio (más reciente primero)
      this.comentarios.update(lista => [nuevo as Comentario, ...lista]);
      this.totalComentarios.update(t => t + 1);
      this.nuevoComentario.set('');
    } catch (error) {
      console.error('Error al comentar', error);
    } finally {
      this.enviandoComentario.set(false);
    }
  }

  // ── Edición de comentario ───────────────────────────────────────────────
  iniciarEdicion(comentario: Comentario) {
    this.comentarioEditandoId.set(comentario._id);
    this.textoEdicion.set(comentario.contenido); // pre-cargar el texto actual
  }

  cancelarEdicion() {
    this.comentarioEditandoId.set(null);
    this.textoEdicion.set('');
  }

  async guardarEdicion(comentarioId: string) {
    const texto = this.textoEdicion().trim();
    const id = this.publicacion()?._id;
    if (!texto || !id) return;

    this.guardandoEdicion.set(true);
    try {
      const actualizado = await this.comentariosService.editar(id, comentarioId, texto);
      // Reemplaza el comentario editado en la lista con el nuevo (que tiene modificado:true)
      this.comentarios.update(lista =>
        lista.map(c => c._id === comentarioId ? (actualizado as Comentario) : c)
      );
      this.cancelarEdicion();
    } catch (error) {
      console.error('Error al editar comentario', error);
    } finally {
      this.guardandoEdicion.set(false);
    }
  }

  // ── Like con actualización optimista ────────────────────────────────────
  async toggleLike() {
    const pub = this.publicacion();
    if (!pub) return;

    const miId = this.auth.user()?._id ?? '';
    const yaLeDiLike = pub.likes.some((l: any) => l.toString() === miId || l === miId);

    // Actualiza la UI al instante antes de esperar al servidor
    this.publicacion.update(p => {
      if (!p) return p;
      const likes = yaLeDiLike
        ? p.likes.filter((l: any) => l.toString() !== miId)
        : [...p.likes, miId];
      return { ...p, likes };
    });

    try {
      yaLeDiLike
        ? await this.publicacionesService.quitarLike(pub._id)
        : await this.publicacionesService.darLike(pub._id);
    } catch {
      await this.cargarPublicacion(pub._id); // revertir si falla
    }
  }

  // Verifica si el usuario logueado puede editar un comentario
  puedoEditarComentario(autorId: string): boolean {
    return this.auth.user()?._id === autorId;
  }

  volver() {
    this.router.navigate(['/publicaciones']);
  }
}