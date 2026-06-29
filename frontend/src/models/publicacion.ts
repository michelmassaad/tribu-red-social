export interface Comentario {
  _id: string;
  contenido: string;
  autor: {
    _id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    fotoPerfil: string;
  };
  modificado: boolean;  // ← NUEVO — true cuando el usuario editó el comentario
  createdAt: string;
  updatedAt: string;
}

export interface Publicacion {
  _id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  autor: {
    _id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    fotoPerfil: string;
  };
  likes: string[];
  comentarios?: Comentario[];
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginadoPublicaciones {
  datos: Publicacion[];
  total: number;
  limit: number;
  offset: number;
}

// NUEVO — interfaz para la respuesta paginada de comentarios
export interface PaginadoComentarios {
  datos: Comentario[];
  total: number;
  limit: number;
  offset: number;
}