import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], // Exportamos para que AuthModule lo pueda usar
})
export class CloudinaryModule {}