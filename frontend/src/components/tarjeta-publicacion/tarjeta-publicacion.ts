import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Publicacion } from '../../models/publicacion';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tarjeta-publicacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-publicacion.html',
  styleUrl: './tarjeta-publicacion.css',
})
export class TarjetaPublicacionComponent {

  // input() — recibe la publicación desde el componente padre
  readonly publicacion = input.required<Publicacion>();

  // output() — avisa al padre cuando el usuario hace algo
  readonly onToggleLike = output<string>();  // emite el ID de la publicación
  readonly onEliminar = output<string>();    // emite el ID de la publicación

  private auth = inject(AuthService);

  // ¿El usuario actual ya le dio like a esta publicación?
  yaLeDiLike = computed(() => {
    const miId = this.auth.user()?._id;
    return this.publicacion().likes.includes(miId ?? '');
  });

  // ¿Esta publicación es mía o soy admin?
  puedoEliminar = computed(() => {
    const miId = this.auth.user()?._id;
    const soyElAutor = this.publicacion().autor._id === miId;
    const soyAdmin = this.auth.esAdmin();
    return soyElAutor || soyAdmin;
  });

  clickLike() {
    this.onToggleLike.emit(this.publicacion()._id);
  }

  clickEliminar() {
    this.onEliminar.emit(this.publicacion()._id);
  }
}