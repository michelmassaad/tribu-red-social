import {
  Controller, Post, Body, UploadedFile,
  UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer'; // ← memoryStorage: la foto queda en RAM
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

// Multer con memoryStorage: la foto se guarda en RAM como Buffer.
// Luego el AuthService la envía a Cloudinary desde esa RAM.
// NO se guarda nada en disco del servidor.
const multerOpciones = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
};

@Controller('auth') // → /api/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  // POST /api/auth/registro
  // Recibe FormData (campos de texto + imagen)
  @Post('registro')
  @HttpCode(HttpStatus.CREATED) // → HTTP 201
  @UseInterceptors(FileInterceptor('file', multerOpciones))
  registro(
    @Body() dto: RegistroDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.authService.registro(dto, archivo);
  }

  // POST /api/auth/login
  // Recibe JSON con { identificador, password }
  @Post('login')
  @HttpCode(HttpStatus.OK) // → HTTP 200
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}