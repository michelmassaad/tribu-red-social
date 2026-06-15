import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    UsuariosModule,    // Para usar UsuariosService en AuthService
    CloudinaryModule,  // Para usar CloudinaryService en AuthService

JwtModule.register({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  signOptions: {
    // 🚀 ENVOLVÉ ENTRE PARÉNTESIS Y AGREGÁ EL "as any" AL FINAL:
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  },
}),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}