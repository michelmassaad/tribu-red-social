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
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Formato de paginación con offset/limit (consigna oficial Sprint #2)
export interface PaginadoPublicaciones {
  datos: Publicacion[];
  total: number;
  limit: number;
  offset: number;
}

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
  publicacion: string;
  modificado: boolean;
  createdAt: string;
}

export interface PaginadoComentarios {
  datos: Comentario[];
  meta: { pagina: number; limite: number; total: number; totalPaginas: number };
}