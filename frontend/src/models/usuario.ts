export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  correo: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcionBreve: string;
  fotoPerfil: string;
  perfil: 'usuario' | 'administrador';
  activo: boolean;
  createdAt: string;
}

export interface RespuestaLogin {
  token: string; // El profesor usa "token", no "access_token"
  usuario: Omit<Usuario, 'password'>;
}