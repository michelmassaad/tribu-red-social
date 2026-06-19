import {
  Controller, Post, Get, Body, UploadedFile,
  UseInterceptors, UseGuards, Request,
  HttpCode, HttpStatus, Res,
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

  // ── HELPER PRIVADO ────────────────────────────────────────────────────────
  // sameSite 'lax' en lugar de 'strict' (clase) → funciona en localhost cross-port
  // secure false en dev porque no hay HTTPS local, true solo en producción
  // maxAge 15 minutos sincronizado con el expiresIn del JWT
  private setTokenCookie(res: Response, token: string) {
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: 1000 * 60 * 15,
    });
  }
}