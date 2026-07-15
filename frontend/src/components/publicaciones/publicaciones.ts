import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../services/publicaciones';
import { TarjetaPublicacionComponent } from '../tarjeta-publicacion/tarjeta-publicacion';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TarjetaPublicacionComponent],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class PublicacionesComponent implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  // ==========================================
  // ESTADO DE LA VISTA
  // ==========================================
  publicaciones = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);
  loadingMas = signal(false);
  mostrarFormulario = signal(false);
  publicando = signal(false);
  errorPublicacion = signal('');

  // Modal de confirmación de eliminación
  mostrarModalEliminar = signal(false);
  idAEliminar = signal<string | null>(null);
  eliminando = signal(false);

  // Paginación y filtros
  ordenamiento = signal('fecha');
  offset = signal(0);
  limit = 3;

  hayMas = computed(() => this.publicaciones().length < this.total());
  nombreImagen = computed(() => this.imagenSeleccionada()?.name || '');

  // ==========================================
  // FORMULARIO DE CREACIÓN
  // ==========================================
  crearForm = this.fb.group({
  titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
  descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]]
  });
  imagenSeleccionada = signal<File | null>(null);
  imagenPreview = signal<string | null>(null); // ← nuevo

  async ngOnInit() {
    await this.auth.sessionReady;
    this.cargarPublicaciones();
  }

  // ==========================================
  // MÉTODOS DE RED / API
  // ==========================================
  async cargarPublicaciones(reset = true) {
    if (reset) {
      this.offset.set(0);
      this.loading.set(true);
    } else {
      this.loadingMas.set(true);
    }

    try {
      const res = await this.publicacionesService.listar(this.offset(), this.limit, this.ordenamiento());

      if (reset) {
        this.publicaciones.set(res.datos || []);
      } else {
        this.publicaciones.update(actuales => [...actuales, ...(res.datos || [])]);
      }
      this.total.set(res.total || 0);
    } catch (error) {
      console.error('Error al cargar el muro', error);
    } finally {
      this.loading.set(false);
      this.loadingMas.set(false);
    }
  }

  cambiarOrden(nuevoOrden: string) {
    this.ordenamiento.set(nuevoOrden);
    this.cargarPublicaciones(true);
  }

  cargarMas() {
    this.offset.update(v => v + this.limit);
    this.cargarPublicaciones(false);
  }

  // ==========================================
  // MANEJO DEL FORMULARIO Y ARCHIVOS
  // ==========================================
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.imagenSeleccionada.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagenPreview.set(e.target?.result as string); // ← nuevo
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }

    this.publicando.set(true);
    this.errorPublicacion.set('');

    const formData = new FormData();
    formData.append('titulo', this.crearForm.value.titulo as string);
    formData.append('descripcion', this.crearForm.value.descripcion as string);

    if (this.imagenSeleccionada()) {
      formData.append('file', this.imagenSeleccionada() as File);
    }

    try {
      await this.publicacionesService.crear(formData);
      this.crearForm.reset();
      this.imagenSeleccionada.set(null);
      this.imagenPreview.set(null); // ← limpiar preview
      this.mostrarFormulario.set(false);
      this.ordenamiento.set('fecha');
      this.cargarPublicaciones(true);
    } catch (error: any) {
      console.error('Error al publicar', error);
      this.errorPublicacion.set(error.error?.message || 'Error al intentar subir la publicación.');
    } finally {
      this.publicando.set(false);
    }
  }

  // ==========================================
  // INTERACCIONES DE LAS TARJETAS
  // ==========================================
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
      if (yaLeDiLike) {
        await this.publicacionesService.quitarLike(id);
      } else {
        await this.publicacionesService.darLike(id);
      }
    } catch (error) {
      console.error('Error al procesar la reacción de me gusta', error);
      this.cargarPublicaciones(true);
    }
  }

  eliminar(id: string) {
    this.idAEliminar.set(id);
    this.mostrarModalEliminar.set(true);
  }

  async confirmarEliminar() {
    const id = this.idAEliminar();
    if (!id) return;

    this.eliminando.set(true);
    try {
      await this.publicacionesService.eliminar(id);
      this.publicaciones.update(lista => lista.filter(p => p._id !== id));
      this.total.update(t => t - 1);
    } catch (error) {
      console.error('Error al remover la publicación seleccionada', error);
    } finally {
      this.eliminando.set(false);
      this.cerrarModalEliminar();
    }
  }

  cerrarModalEliminar() {
    this.mostrarModalEliminar.set(false);
    this.idAEliminar.set(null);
  }
}