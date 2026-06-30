import {
  IsString, IsEmail, IsNotEmpty, MinLength,
  Matches, IsDateString, IsOptional, IsIn
} from 'class-validator';

export class CrearUsuarioAdminDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  correo: string;

  @IsString()
  @IsNotEmpty()
  nombreUsuario: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Mínimo 8 caracteres, una mayúscula y un número',
  })
  password: string;

  @IsDateString()
  fechaNacimiento: string;

  @IsOptional()
  @IsString()
  descripcionBreve?: string;

  // El admin puede elegir el perfil — por defecto 'usuario'
  @IsOptional()
  @IsIn(['usuario', 'administrador'])
  perfil?: string;
}