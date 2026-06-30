import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { firstValueFrom, timer } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink], 
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  
  private fb = inject(FormBuilder);

  // ==========================================
  // ESTADO DEL FORMULARIO REACTIVO
  // ==========================================
  loginForm = this.fb.group({
    // Puede ser correo o nombre de usuario, por lo que quitamos Validators.email 
    identificador: ['', [Validators.required]],
    // Mínimo 8 caracteres, al menos una mayúscula y un número 
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/) 
    ]] 
  });

  // Signals para la interfaz
  loading = signal(false);
  errorMensaje = signal('');
  mensajeExitoso = signal('');

  // Usuarios de prueba actualizados para cumplir con los requisitos de la contraseña 
  usuariosTest = [
    { identificador: 'jugador1@mail.com', password: 'Password1', label: 'Jugador 1' },
    { identificador: 'jugador2', password: 'Password2', label: 'Jugador 2' },
    { identificador: 'jugador3@mail.com', password: 'Password3', label: 'Jugador 3' },
  ];

  async onSubmit() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched();
    return;
  }

  this.loading.set(true);
  this.errorMensaje.set('');
  this.mensajeExitoso.set('');

  const { identificador, password } = this.loginForm.value;
  const loginCorrecto = await this.auth.login(identificador as string, password as string);

  if (loginCorrecto) {
    await firstValueFrom(timer(500));           // ← pausa para que se vea
    this.mensajeExitoso.set('Inicio sesión exitoso...');   // ← mensaje inmediato
    await firstValueFrom(timer(1500));           // ← pausa para que se vea
    this.router.navigate(['/publicaciones']);
  } else {
    this.errorMensaje.set(this.auth.errorMensaje() || 'Credenciales incorrectas o usuario no registrado.');
    this.loading.set(false);
  }
}

  // Método para los botones de acceso rápido
  loginTest(identificadorTest: string, passwordTest: string) {
    this.loginForm.patchValue({
      identificador: identificadorTest,
      password: passwordTest
    });
  }

  // Lógica del ojito de contraseña
  mostrarPassword = signal(false);
  habilitarPassword() {
    this.mostrarPassword.set(!this.mostrarPassword());
  }
}