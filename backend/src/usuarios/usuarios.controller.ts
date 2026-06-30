import {
  Controller, Get, Post, Delete, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CrearUsuarioAdminDto } from './dto/crear-usuario-admin.dto';
import * as bcrypt from 'bcryptjs';

// Todas las rutas de este controller requieren token válido + ser admin
@Controller('usuarios')
@UseGuards(AuthGuard, AdminGuard)
export class UsuariosController {

  constructor(
    private usuariosService: UsuariosService,
  ) {}

  // GET /api/usuarios
  // Lista todos los usuarios sin su password
  @Get()
  listar() {
    return this.usuariosService.listarTodos();
  }

  // POST /api/usuarios
  // Crea un nuevo usuario — el admin puede definir el perfil
  // El password se encripta igual que en el registro normal
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(@Body() dto: CrearUsuarioAdminDto) {
    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(dto.password, salt);

    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      password: passwordHasheada,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcionBreve: dto.descripcionBreve || '',
      fotoPerfil: '',
      fotoPerfilPublicId: '',
      perfil: dto.perfil || 'usuario',
      activo: true,
    });

    const obj = usuario.toObject();
    const { password, ...sinPassword } = obj;
    return { mensaje: 'Usuario creado correctamente', usuario: sinPassword };
  }

  // DELETE /api/usuarios/:id
  // Deshabilita el usuario (baja lógica — activo: false)
  // Al intentar loguearse, recibirá un 401 con mensaje explicativo
  @Delete(':id')
  deshabilitar(@Param('id') id: string) {
    return this.usuariosService.deshabilitar(id);
  }

  // POST /api/usuarios/:id/habilitar
  // Rehabilita un usuario previamente deshabilitado
  @Post(':id/habilitar')
  @HttpCode(HttpStatus.OK)
  habilitar(@Param('id') id: string) {
    return this.usuariosService.habilitar(id);
  }
}