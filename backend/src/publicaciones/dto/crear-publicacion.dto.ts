import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CrearPublicacionDto {

  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(3, { message: 'Mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Máximo 100 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @MinLength(10, { message: 'Mínimo 10 caracteres' })
  @MaxLength(2000, { message: 'Máximo 2000 caracteres' })
  descripcion: string;
}