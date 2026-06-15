import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  // El frontend manda "identificador" que puede ser correo o nombreUsuario
  @IsString()
  @IsNotEmpty({ message: 'El correo o nombre de usuario es obligatorio' })
  identificador: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;
}