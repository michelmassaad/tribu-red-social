import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesController } from './publicaciones.controller';
import { PublicacionesService } from './publicaciones.service';
import { Publicacion, PublicacionSchema } from './schemas/publicacion.schema';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
// ── Imports nuevos de comentarios ──────────────────────────────────────────
import { ComentariosController } from './comentarios/comentarios.controller';
import { ComentariosService } from './comentarios/comentarios.service';
import { Comentario, ComentarioSchema } from './comentarios/schemas/comentario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema }, // ← nuevo
    ]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [PublicacionesController, ComentariosController], // ← nuevo
  providers: [PublicacionesService, ComentariosService],         // ← nuevo
})
export class PublicacionesModule {}