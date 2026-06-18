import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // ← Este registra las estrategias
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy'; // ← Esta es la estrategia "jwt"
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsuariosModule,
    CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // ← registra Passport
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'clave-fallback',
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,   // ← le dice a Passport que existe la estrategia "jwt"
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}