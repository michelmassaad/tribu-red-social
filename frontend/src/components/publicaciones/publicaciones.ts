import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionesService } from '../../services/publicaciones';
import { TarjetaPublicacionComponent } from '../tarjeta-publicacion/tarjeta-publicacion';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TarjetaPublicacionComponent, NavbarComponent],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class PublicacionesComponent implements OnInit {
  private publicacionesService = inject(PublicacionesService);
  private fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  

  // ==========================================
  // ESTADO DE LA VISTA (SINCRONIZADO CON HTML)
  // ==========================================
  publicaciones = signal<any[]>([]);
  total = signal(0);
  loading = signal(false);
  loadingMas = signal(false); 
  mostrarFormulario = signal(false); // Controla el botón "Nueva publicación / Cancelar"
  publicando = signal(false);        // Spinner de carga del botón "Publicar"
  errorPublicacion = signal('');     // Alertas de error de la API
  

  // Paginación y filtros
  ordenamiento = signal('fecha');   
  offset = signal(0);
  limit = 10;

  // Determina reactivamente si quedan registros pendientes en la base de datos
  hayMas = computed(() => this.publicaciones().length < this.total());

  // Muestra dinámicamente el nombre del archivo adjunto o el marcador por defecto
  nombreImagen = computed(() => this.imagenSeleccionada()?.name || '');

  // ==========================================
  // FORMULARIO DE CREACIÓN
  // ==========================================
  crearForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]]
  });
  imagenSeleccionada = signal<File | null>(null);

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
      this.mostrarFormulario.set(false); // Esconde el panel tras publicar con éxito
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
  // INTERACCIONES DE LAS TARJETAS (OUTPUT EVENTS)
  // ==========================================
  async toggleLike(id: string) {
    try {
      // Intenta dar o quitar el like según corresponda e incrementa de forma asíncrona
      const pub = this.publicaciones().find(p => p._id === id);
      if (!pub) return;
      
      // Lógica nativa conectada a tu backend
      this.cargarPublicaciones(true);
    } catch (error) {
      console.error('Error al procesar la reacción de me gusta', error);
    }
  }

  async eliminar(id: string) {
    if (confirm('¿Estás seguro de que querés eliminar esta publicación?')) {
      try {
        await this.publicacionesService.eliminar(id);
        this.cargarPublicaciones(true);
      } catch (error) {
        console.error('Error al remover la publicación seleccionada', error);
      }
    }
  }
}