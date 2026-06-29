import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from "../components/navbar/navbar";
import { AuthService } from '../services/auth';
import { PantallaCargaComponent } from '../components/pantalla-carga/pantalla-carga';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PantallaCargaComponent, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  public auth = inject(AuthService);

  private router = inject(Router);

  // Variable que controla si la app entera está cargando
  appCargando = signal(true);

  async ngOnInit() {
    // 1. Promesa de 1.5 segundos para que la pantalla se vea fluida
    const tiempoMinimo = new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Ejecutamos la validación en el backend y el timer en paralelo
    const [usuario] = await Promise.all([
      this.auth.autorizar(),
      tiempoMinimo
    ]);

    if (usuario) {
      // Si el token es válido, iniciamos el timer de los 10 minutos
      this.auth.iniciarTimerSesion();

      // Solo lo forzamos a ir a /publicaciones si estaba en la raíz o en el login
      // Si el usuario intentaba entrar directo a un perfil, lo dejamos seguir.
      if (this.router.url === '/' || this.router.url === '/login') {
        this.router.navigate(['/publicaciones']);
      }
    } else {
      // Si falla, purga sesión y lo manda al login sí o sí
      this.router.navigate(['/login']);
    }

    // 3. Ocultamos la pantalla de cristal y mostramos la app
    this.appCargando.set(false);
  }
}