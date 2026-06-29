import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class EditarComentarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  @MaxLength(500, { message: 'Máximo 500 caracteres' })
  contenido: string;
}