import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsuariosService } from '../usuarios/usuarios.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ── REGISTRO ──────────────────────────────────────────────────────────────
  // Solo crea el usuario. No genera token porque después el usuario
  // va a la pantalla de login y se autentica ahí.
  async registro(dto: RegistroDto, archivo?: Express.Multer.File) {

    // 1. Verificar que el correo no esté ya registrado
    const correoExistente = await this.usuariosService.buscarPorCorreo(dto.correo);
    if (correoExistente) {
      throw new ConflictException('El correo ya está registrado'); // HTTP 409
    }

    // 2. Verificar que el nombreUsuario no esté en uso
    const usuarioExistente = await this.usuariosService.buscarPorNombreUsuario(dto.nombreUsuario);
    if (usuarioExistente) {
      throw new ConflictException('El nombre de usuario ya está en uso'); // HTTP 409
    }

    // 3. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(dto.password, salt);

    // 4. Subir la foto a Cloudinary (si se adjuntó una)
    let fotoPerfil = '';
    let fotoPerfilPublicId = '';

    if (archivo) {
      // ✅ Foto de perfil: recortamos a cuadrado 400x400 centrado en la cara
      const resultado = await this.cloudinaryService.subirImagen(
        archivo,
        'red-social/usuarios',
        [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      );
      fotoPerfil = resultado.url;
      fotoPerfilPublicId = resultado.publicId;
    }

    // 5. Guardar el usuario en MongoDB
    const usuario = await this.usuariosService.crear({
      nombre: dto.nombre,
      apellido: dto.apellido,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      password: passwordHasheada,
      fechaNacimiento: new Date(dto.fechaNacimiento),
      descripcionBreve: dto.descripcionBreve || '',
      fotoPerfil,
      fotoPerfilPublicId,
      perfil: dto.perfil || 'usuario',
      activo: true,
    });

    // 6. Retornar confirmación sin exponer el password ni generar token
    const obj = usuario.toObject();
    const { password, ...usuarioSinPassword } = obj;

    return {
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioSinPassword,
    };
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // Autentica al usuario y genera el token JWT.
  async login(dto: LoginDto) {

    // 1. Buscar por correo O por nombreUsuario
    let usuario = await this.usuariosService.buscarPorCorreo(dto.identificador);
    if (!usuario) {
      usuario = await this.usuariosService.buscarPorNombreUsuario(dto.identificador);
    }

    // 2. Si no existe o está deshabilitado → 401
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Comparar la contraseña recibida con el hash guardado
    const passwordValida = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Retornar token y datos del usuario (sin password)
    const obj = usuario.toObject();
    const { password, ...usuarioSinPassword } = obj;

    return {
      token: this.generarToken(usuario),
      usuario: usuarioSinPassword,
    };
  }

  // ── OBTENER PERFIL ────────────────────────────────────────────────────────
  // Para la ruta GET /api/auth/me.
  // Angular la llama al arrancar para restaurar la sesión si la cookie sigue válida.
  async obtenerPerfil(userId: string) {
    const usuario = await this.usuariosService.buscarPorId(userId);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    const { password, ...usuarioSinPassword } = usuario.toObject();
    return usuarioSinPassword;
  }

  // ── REFRESCAR TOKEN ───────────────────────────────────────────────────────
  // Crea un nuevo JWT con los mismos datos del usuario y 15 min nuevos.
  // El usuario sigue siendo el mismo — solo se extiende el tiempo de validez.
  async refrescar(usuarioPayload: any) {
    // Buscamos los datos frescos del usuario desde la DB
    const usuario = await this.usuariosService.buscarPorId(usuarioPayload.userId);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    // generarToken() usa el helper privado que ya tenías — mismo payload, nuevo exp
    const nuevoToken = this.generarToken(usuario);
    const { password, ...usuarioSinPassword } = usuario.toObject();
    return { token: nuevoToken, usuario: usuarioSinPassword };
  }

  // ── ACTUALIZAR PERFIL ───────────────────────────────────────────────────────

  async actualizarFotoPerfil(userId: string, archivo: Express.Multer.File) {
        //  Buscamos al usuario para ver si tiene una foto vieja
        const usuarioActual = await this.usuariosService.buscarPorId(userId);
        if (!usuarioActual) {
            throw new UnauthorizedException('Usuario no encontrado');
        }

        //  Subimos la nueva foto a Cloudinary 
        const resultado = await this.cloudinaryService.subirImagen(
            archivo,
            'red-social/usuarios',
            [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        );

        //  Borramos la foto anterior de Cloudinary si existía un publicId
        if (usuarioActual.fotoPerfilPublicId) {
            try {
                await this.cloudinaryService.eliminarImagen(usuarioActual.fotoPerfilPublicId);
            } catch (error) {
                console.warn(`No se pudo borrar la foto anterior (ID: ${usuarioActual.fotoPerfilPublicId}) en Cloudinary:`, error);
                // No lanzamos excepción porque no queremos frenar el flujo si falla el borrado
            }
        }

        // Actualizamos el registro en la base de datos a través de usuariosService
        const usuarioActualizado = await this.usuariosService.actualizarCampos(userId, {
            fotoPerfil: resultado.url,
            fotoPerfilPublicId: resultado.publicId
        });

        if (!usuarioActualizado) {
            throw new UnauthorizedException('No se pudo actualizar, usuario no encontrado');
        }
        // ---------------------------------

        // Retornamos el usuario actualizado sin exponer la contraseña
        const obj = usuarioActualizado.toObject();
        const { password, ...usuarioSinPassword } = obj;

        return {
            mensaje: 'Foto de perfil actualizada exitosamente',
            usuario: usuarioSinPassword,
        };
    }


  // ── HELPER PRIVADO ────────────────────────────────────────────────────────
  // Centraliza la generación del token para no repetir el payload en cada método.
  private generarToken(usuario: any): string {
    return this.jwtService.sign({
      sub: usuario._id.toString(),
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    });
  }

  
}