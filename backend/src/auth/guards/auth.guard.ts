import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {

  // Inyectamos JwtService para verificar el token
  constructor(private readonly jwtService: JwtService) {}

  // Método principal del guardia que se ejecuta para cada solicitud protegida
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest(); // Obtenemos el objeto de solicitud HTTP
    const token = this.extractTokenFromCookie(request); // Extraemos el token de las cookies

    if (!token) throw new UnauthorizedException(); // Si no hay token, lanzamos una excepción de no autorizado

    try {
      // Verificamos el token y extraemos su payload
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = {
        userId: payload['sub'],
        correo: payload['correo'],
        nombreUsuario: payload['nombreUsuario'],
        perfil: payload['perfil'],
      };
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  // Método auxiliar para extraer el token de las cookies de la solicitud
  private extractTokenFromCookie(request: Request): string | undefined {
    if (request.cookies && request.cookies['access_token']) {
      return request.cookies['access_token'];
    }
    return undefined;
  }
}