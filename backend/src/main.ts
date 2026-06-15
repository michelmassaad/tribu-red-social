import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite que Angular (puerto 4200) hable con este servidor (3000)
  app.enableCors({
    origin: 'http://localhost:4200',
  });

  // Activa las validaciones de los DTOs en todos los endpoints.
  // Si falta un campo requerido → responde automáticamente HTTP 400
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Todas las rutas empiezan con /api → /api/auth/login, /api/auth/registro
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000);
  console.log(`Servidor en http://localhost:${process.env.PORT || 3000}/api`);
}
bootstrap();
