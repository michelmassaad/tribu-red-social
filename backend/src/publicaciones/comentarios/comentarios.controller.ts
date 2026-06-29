import {
  Controller, Post, Put, Get, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ComentariosService } from './comentarios.service';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { EditarComentarioDto } from './dto/editar-comentario.dto';
import { AuthGuard } from '../../auth/guards/auth.guard';

// @UseGuards en la clase protege TODAS las rutas — hay que estar logueado
@Controller('publicaciones/:publicacionId/comentarios')
@UseGuards(AuthGuard)
export class ComentariosController {

  constructor(private comentariosService: ComentariosService) {}

  // POST /api/publicaciones/:publicacionId/comentarios
  @Post()
  @HttpCode(HttpStatus.CREATED) // devuelve 201 Created en lugar del 200 por defecto
  agregar(
    @Param('publicacionId') publicacionId: string, // extrae el ID de la URL
    @Body() dto: CrearComentarioDto,               // valida el body con el DTO
    @Request() req: any,                           // req.user viene del AuthGuard
  ) {
    return this.comentariosService.agregar(publicacionId, req.user.userId, dto);
  }

  // PUT /api/publicaciones/:publicacionId/comentarios/:comentarioId
  @Put(':comentarioId')
  editar(
    @Param('comentarioId') comentarioId: string,
    @Body() dto: EditarComentarioDto,
    @Request() req: any,
  ) {
    return this.comentariosService.editar(comentarioId, req.user.userId, dto);
  }

  // GET /api/publicaciones/:publicacionId/comentarios?offset=0&limit=10
  @Get()
  listar(
    @Param('publicacionId') publicacionId: string,
    @Query('offset') offset = '0',  // Query params llegan como string, hay que parsear
    @Query('limit') limit = '10',
  ) {
    return this.comentariosService.listar(
      publicacionId,
      parseInt(offset),
      parseInt(limit),
    );
  }
}