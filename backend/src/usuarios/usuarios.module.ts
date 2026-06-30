import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usuario.name, schema: UsuarioSchema }]),
    JwtModule, // ← solo JwtModule (ya es global), no AuthModule completo
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService, AuthGuard, AdminGuard], // ← registrar los guards acá
  exports: [UsuariosService],
})
export class UsuariosModule {}