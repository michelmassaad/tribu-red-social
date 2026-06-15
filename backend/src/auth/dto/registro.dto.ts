import {
  IsEmail, IsString, IsNotEmpty,
  MinLength, IsDateString, IsOptional, Matches,
} from 'class-validator';

export class RegistroDto {

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene formato válido' })
  correo: string;

  @IsString()
  @MinLength(3, { message: 'Mínimo 3 caracteres' })
  nombreUsuario: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe tener al menos una mayúscula y un número',
  })
  password: string;

  @IsDateString({}, { message: 'Formato de fecha: YYYY-MM-DD' })
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  descripcionBreve?: string;

  @IsOptional()
  @IsString()
  perfil?: string;

  // La foto viene separada — Multer la procesa, no va en el DTO
}