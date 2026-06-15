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
      // archivo.buffer contiene la foto en RAM (gracias a memoryStorage en el controller)
      const resultado = await this.cloudinaryService.subirImagen(archivo);
      fotoPerfil = resultado.url;       // URL pública de Cloudinary
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

    // 6. Retornar sin exponer el password
    const obj = usuario.toObject();
    const { password, ...usuarioSinPassword } = obj;

    return {
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuarioSinPassword,
    };
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
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

    // 4. Generar el token JWT
    const token = this.jwtService.sign({
      sub: usuario._id.toString(),
      correo: usuario.correo,
      nombreUsuario: usuario.nombreUsuario,
      perfil: usuario.perfil,
    });

    // 5. Retornar token y datos del usuario (sin password)
    const obj = usuario.toObject();
    const { password, ...usuarioSinPassword } = obj;

    return {
      token,             // El frontend busca "token" (no "access_token")
      usuario: usuarioSinPassword,
    };
  }
}