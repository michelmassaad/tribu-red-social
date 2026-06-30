import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios.service';
import { Usuario } from '../../../models/usuario';
import { HighlightDirective } from '../../../directives/highlight.directive';
import { AutoFocusDirective } from '../../../directives/auto-focus.directive';
import { ClickFueraDirective } from '../../../directives/click-fuera.directive';
import { PrimeraMayusculaPipe } from '../../../pipes/primera-mayuscula.pipe';
import { FechaRelativaPipe } from '../../../pipes/fecha-relativa.pipe';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    HighlightDirective, AutoFocusDirective, ClickFueraDirective,
    PrimeraMayusculaPipe, FechaRelativaPipe,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private fb = inject(FormBuilder);

  usuarios = signal<Usuario[]>([]);
  cargando = signal(true);
  mostrarFormulario = signal(false);
  guardando = signal(false);
  errorMensaje = signal('');
  exitoMensaje = signal('');

  // Formulario de creación de usuario
  crearForm = this.fb.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
    nombreUsuario: ['', [Validators.required]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/),
    ]],
    repetirPassword: ['', [Validators.required]],
    fechaNacimiento: ['', [Validators.required]],
    descripcionBreve: [''],
    perfil: ['usuario', [Validators.required]],
  }, { validators: this.validarPasswords });

  private validarPasswords(control: AbstractControl): ValidationErrors | null {
    const pass = control.get('password')?.value;
    const repeat = control.get('repetirPassword')?.value;
    return pass === repeat ? null : { noCoincide: true };
  }

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
    this.cargando.set(true);
    try {
      const lista = await this.usuariosService.listar();
      this.usuarios.set(lista);
    } catch (e) {
      console.error('Error al cargar usuarios', e);
    } finally {
      this.cargando.set(false);
    }
  }

  async onSubmit() {
    if (this.crearForm.invalid) {
      this.crearForm.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    this.errorMensaje.set('');
    try {
      const { repetirPassword, ...datos } = this.crearForm.value;
      await this.usuariosService.crear(datos);
      this.exitoMensaje.set('Usuario creado correctamente');
      this.crearForm.reset({ perfil: 'usuario' });
      this.mostrarFormulario.set(false);
      await this.cargarUsuarios();
      setTimeout(() => this.exitoMensaje.set(''), 3000);
    } catch (e: any) {
      this.errorMensaje.set(e.error?.message || 'Error al crear el usuario');
    } finally {
      this.guardando.set(false);
    }
  }

  async deshabilitar(id: string) {
    try {
      await this.usuariosService.deshabilitar(id);
      await this.cargarUsuarios();
    } catch (e) {
      console.error('Error al deshabilitar', e);
    }
  }

  async habilitar(id: string) {
    try {
      await this.usuariosService.habilitar(id);
      await this.cargarUsuarios();
    } catch (e) {
      console.error('Error al habilitar', e);
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.crearForm.reset({ perfil: 'usuario' });
    this.errorMensaje.set('');
  }
}