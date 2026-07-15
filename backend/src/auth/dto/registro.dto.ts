import {
  IsEmail, IsString, IsNotEmpty,
  MinLength, MaxLength, IsDateString, IsOptional, Matches,
} from 'class-validator';

export class RegistroDto {

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'Máximo 50 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿñÑ\s'-]+$/, { message: 'El nombre solo puede contener letras y espacios' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(50, { message: 'Máximo 50 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿñÑ\s'-]+$/, { message: 'El apellido solo puede contener letras y espacios' })
  apellido: string;

  @IsEmail({}, { message: 'El correo no tiene formato válido' })
  correo: string;

  @IsString()
  @MinLength(3, { message: 'Mínimo 3 caracteres' })
  @MaxLength(20, { message: 'Máximo 20 caracteres' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'El usuario solo puede tener letras, números y guion bajo' })
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
  @MaxLength(160, { message: 'Máximo 160 caracteres' })
  descripcionBreve?: string;

  // 'perfil' se eliminó a propósito. El registro público SIEMPRE crea
  // usuarios con perfil 'usuario' — nunca hay que confiar en un valor
  // de rol que venga del cliente. Los admins se crean solo desde
  // POST /api/usuarios, que ya está protegido con AuthGuard + AdminGuard.

  // La foto viene separada — Multer la procesa, no va en el DTO
}