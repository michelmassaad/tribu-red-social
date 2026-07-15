import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { firstValueFrom, timer } from 'rxjs';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMensaje = signal('');
  mensajeExitoso = signal('');
  mostrarPassword = signal(false);

  registroForm = this.fb.group({
  nombre: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
  apellido: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
  correo: ['', [Validators.required, Validators.email]],
  nombreUsuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
  password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/)]],
  repetirPassword: ['', [Validators.required]],
  fechaNacimiento: ['', [Validators.required]],
  descripcionBreve: ['', [Validators.required, Validators.maxLength(160)]],
  perfil: ['usuario', [Validators.required]]
  }, { validators: this.validarContraseñasIdenticas });

  private validarContraseñasIdenticas(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const repetirPassword = control.get('repetirPassword')?.value;
    return password === repetirPassword ? null : { noCoincide: true };
  }

  fotoSeleccionada: File | null = null;
  fotoPreview = signal<string | null>(null); // ← signal

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.fotoSeleccionada = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fotoPreview.set(e.target?.result as string); // ← .set()
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMensaje.set('');
    this.mensajeExitoso.set('');

    const formData = new FormData();
    Object.keys(this.registroForm.controls).forEach(key => {
      const value = this.registroForm.get(key)?.value;
      if (value && key !== 'repetirPassword') {
        formData.append(key, value);
      }
    });

    if (this.fotoSeleccionada) {
      formData.append('file', this.fotoSeleccionada);
    }

    const registrado = await this.authService.registro(formData);

    if (registrado) {
      this.mensajeExitoso.set('¡Cuenta creada con éxito!');
      this.registroForm.reset();
      this.fotoSeleccionada = null;  // ← limpiar
      this.fotoPreview.set(null);    // ← limpiar preview
      await firstValueFrom(timer(1500));
      this.router.navigate(['/login']);
    } else {
      this.errorMensaje.set(
        this.authService.errorMensaje() || 'El usuario o correo ya existen.'
      );
      this.loading.set(false);
    }
  }

  togglePassword() {
    this.mostrarPassword.set(!this.mostrarPassword());
  }
}