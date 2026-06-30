import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

// Todas las rutas requieren token válido + ser admin
@Controller('estadisticas')
@UseGuards(AuthGuard, AdminGuard)
export class EstadisticasController {

  constructor(private estadisticasService: EstadisticasService) {}

  // GET /api/estadisticas/publicaciones-por-usuario?desde=2026-01-01&hasta=2026-12-31
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.estadisticasService.publicacionesPorUsuario(desde, hasta);
  }

  // GET /api/estadisticas/comentarios-por-dia?desde=2026-01-01&hasta=2026-12-31
  @Get('comentarios-por-dia')
  comentariosPorDia(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.estadisticasService.comentariosPorDia(desde, hasta);
  }

  // GET /api/estadisticas/comentarios-por-publicacion?desde=2026-01-01&hasta=2026-12-31
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(
    @Query('desde') desde: string,
    @Query('hasta') hasta: string,
  ) {
    return this.estadisticasService.comentariosPorPublicacion(desde, hasta);
  }
}