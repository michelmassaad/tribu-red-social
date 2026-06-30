import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PublicacionesModule } from './publicaciones/publicaciones.module';
import { EstadisticasModule } from './estadisticas/estadisticas.module';

@Module({
  imports: [
    // Carga el .env y lo hace disponible en toda la app
    ConfigModule.forRoot({ isGlobal: true }),

    // Conecta con MongoDB usando la URI del .env
    MongooseModule.forRoot(process.env.MONGODB_URI!),

    AuthModule,
    UsuariosModule,
    PublicacionesModule,
    EstadisticasModule,
  ],
})
export class AppModule {}
