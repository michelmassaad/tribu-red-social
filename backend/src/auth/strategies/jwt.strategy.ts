import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(private usuariosService: UsuariosService) {
    super({
      // Busca el token en el header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'clave-fallback',
    });
  }

  // NestJS llama a este método automáticamente si el token es válido.
  // Lo que retornemos acá va a estar disponible como "req.user" en el controller.
  async validate(payload: { sub: string; correo: string; perfil: string }) {
    const usuario = await this.usuariosService.buscarPorId(payload.sub);

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Token inválido');
    }

    return {
      userId: payload.sub,
      correo: payload.correo,
      perfil: payload.perfil,
    };
  }
}