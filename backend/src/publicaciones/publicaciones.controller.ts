import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PublicacionesService } from './publicaciones.service';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

// Configuración de Multer — igual que en auth, guarda la foto en RAM
const multerOpciones = {
  storage: memoryStorage(),
  fileFilter: (req: any, file: any, cb: any) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(null, false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
};

// @UseGuards(JwtAuthGuard) en la clase → protege TODAS las rutas de este controller
@Controller('publicaciones')
@UseGuards(AuthGuard)
export class PublicacionesController {

  constructor(private publicacionesService: PublicacionesService) { }

  // POST /api/publicaciones
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOpciones))
  crear(
    @Body() dto: CrearPublicacionDto,
    @Request() req: any,  // req.user tiene los datos del token (userId, correo, perfil)
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.publicacionesService.crear(dto, req.user.userId, archivo);
  }

  // GET /api/publicaciones?offset=0&limit=10&ordenarPor=fecha&autorId=xxx
  @Get()
  listar(
    @Query('offset') offset = '0',
    @Query('limit') limit = '10',
    @Query('ordenarPor') ordenarPor = 'fecha',
    @Query('autorId') autorId?: string,
  ) {
    return this.publicacionesService.listar(
      parseInt(offset),
      parseInt(limit),
      ordenarPor,
      autorId,
    );
  }

  // GET /api/publicaciones/:id — obtener una publicación por ID
  @Get(':id')
  obtenerUna(@Param('id') id: string) {
    return this.publicacionesService.obtenerUna(id);
  }

  // POST /api/publicaciones/:id/like
  @Post(':id/like')
  darLike(@Param('id') id: string, @Request() req: any) {
    return this.publicacionesService.darLike(id, req.user.userId);
  }

  // DELETE /api/publicaciones/:id/like
  @Delete(':id/like')
  quitarLike(@Param('id') id: string, @Request() req: any) {
    return this.publicacionesService.quitarLike(id, req.user.userId);
  }

  // DELETE /api/publicaciones/:id
  @Delete(':id')
  eliminar(@Param('id') id: string, @Request() req: any) {
    return this.publicacionesService.eliminar(
      id,
      req.user.userId,
      req.user.perfil,
    );
  }
}