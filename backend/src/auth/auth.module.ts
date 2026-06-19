import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    UsuariosModule,
    CloudinaryModule,
    JwtModule.registerAsync({
      global: true,               // JwtService disponible en toda la app
      useFactory: () => ({
        secret: process.env['JWT_SECRET'], // Clave secreta para firmar los tokens
        signOptions: { expiresIn: '15m' }, // Tokens expiran en 15 minutos
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule], // Exportamos JwtModule para usar JwtService en otros módulos
})
export class AuthModule {}