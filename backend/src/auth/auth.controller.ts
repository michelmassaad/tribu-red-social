import {
  Controller, Post, Get, Body, UploadedFile,
  UseInterceptors, UseGuards, Request,
  HttpCode, HttpStatus, Res,Patch, Req, BadRequestException,
    UnauthorizedException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

const multerOpciones = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── REGISTRO ──────────────────────────────────────────────────────────────
  // Sin guard — ruta pública.
  // Sin cookie — el usuario va a hacer login después, ahí se genera el token.
  // Devuelve directo lo que retorna el service.
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOpciones))
  async registro(
    @Body() dto: RegistroDto, // DTO con validaciones
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.authService.registro(dto, archivo);
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // Sin guard — ruta pública.
  // Acá sí se genera el token y se setea la cookie.
  // @Res({ passthrough: true }) → NestJS sigue manejando la respuesta normalmente,
  // solo lo usamos para acceder al objeto res y setear la cookie.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto, // DTO con validaciones 
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.login(dto);
    this.setTokenCookie(res, resultado.token);
    return { mensaje: 'Login exitoso', usuario: resultado.usuario };
  }

  // ── ME ────────────────────────────────────────────────────────────────────
  // Protegida — el guard verifica la cookie.
  // Angular la llama al arrancar para saber si la sesión sigue activa (F5).
  // req.user.userId viene del payload que el guard puso en el request.
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Request() req: any) {
    return this.authService.obtenerPerfil(req.user.userId);
  }

  // ── AUTORIZAR ─────────────────────────────────────────────────────────────
  // POST /api/auth/autorizar
  // El guard verifica la cookie — si es inválida lanza 401 antes de llegar acá.
  // Si llegó, el token es válido → devolvemos los datos del usuario.
  @Post('autorizar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async autorizar(@Request() req: any) {
    return this.authService.obtenerPerfil(req.user.userId);
  }

  // ── REFRESCAR ─────────────────────────────────────────────────────────────
  // POST /api/auth/refrescar
  // Igual — el guard valida el token actual.
  // Si es válido, generamos uno nuevo y lo ponemos en una nueva cookie.
  @Post('refrescar')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async refrescar(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.authService.refrescar(req.user);
    this.setTokenCookie(res, resultado.token); // cookie con 15 min nuevos
    return { mensaje: 'Token refrescado', usuario: resultado.usuario };
  }

  // ── LOGOUT ───────────────────────────────────────────────────────────────
  // Protegida — solo puede cerrar sesión alguien logueado.
  // clearCookie() borra la cookie del browser, el próximo request va a tirar 401.
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  cerrarSesion(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { mensaje: 'Sesión cerrada correctamente' };
  }

  @Patch('me/foto')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async actualizarFoto(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No se ha seleccionado ninguna imagen');
        }

        //  Extraemos el ID exactamente como lo llama tu AuthGuard
        const userId = req.user?.userId;

        //  Agregamos validación de seguridad extra. Si por algún motivo 
        // el Guard no le pasa el ID al Request, lanzamos un 401 limpio en lugar 
        // de un 500 que rompa el servidor.
        if (!userId) {
            throw new UnauthorizedException('No se pudo identificar al usuario desde el token');
        }

        //  Llamamos al servicio con el ID correcto
        return await this.authService.actualizarFotoPerfil(userId, file);
    }

  // ── HELPER PRIVADO ────────────────────────────────────────────────────────
  // sameSite 'lax' en lugar de 'strict' (clase) → funciona en localhost cross-port
  // secure false en dev porque no hay HTTPS local, true solo en producción
  // maxAge 15 minutos sincronizado con el expiresIn del JWT
  private setTokenCookie(res: Response, token: string) {
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: process.env['NODE_ENV'] === 'production' ? 'none' : 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 1000 * 60 * 15,
  });
}
}