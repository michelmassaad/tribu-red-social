import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CrearPublicacionDto {

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(3)
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MinLength(10)
  descripcion: string;
}