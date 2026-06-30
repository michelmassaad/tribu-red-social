import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {

  // El AuthGuard ya corrió antes y puso req.user con el payload del JWT
  // Acá solo verificamos que el perfil sea 'administrador'
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request.user?.perfil !== 'administrador') {
      throw new ForbiddenException('Se requiere perfil de administrador');
    }

    return true;
  }
}