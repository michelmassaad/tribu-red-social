import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comentario, ComentarioDocument } from './schemas/comentario.schema';
import { CrearComentarioDto } from './dto/crear-comentario.dto';
import { EditarComentarioDto } from './dto/editar-comentario.dto';

@Injectable()
export class ComentariosService {

  constructor(
    // Inyectamos el modelo de Comentario para interactuar con MongoDB
    @InjectModel(Comentario.name)
    private comentarioModel: Model<ComentarioDocument>,
  ) {}

  // ── AGREGAR COMENTARIO ────────────────────────────────────────────────────
  async agregar(publicacionId: string, usuarioId: string, dto: CrearComentarioDto) {
    const nuevo = new this.comentarioModel({
      publicacion: new Types.ObjectId(publicacionId),
      autor: new Types.ObjectId(usuarioId),
      contenido: dto.contenido,
      // modificado: false por defecto (definido en el schema)
    });

    const guardado = await nuevo.save();

    // populate reemplaza el ID del autor por sus datos reales
    // para que el frontend pueda mostrar nombre y foto directamente
    return guardado.populate('autor', 'nombre apellido nombreUsuario fotoPerfil');
  }

  // ── EDITAR COMENTARIO ─────────────────────────────────────────────────────
  async editar(
    comentarioId: string,
    usuarioId: string,
    dto: EditarComentarioDto,
  ) {
    const comentario = await this.comentarioModel.findById(comentarioId);
    if (!comentario) throw new NotFoundException('Comentario no encontrado');

    // Solo el autor puede editar — si intenta otro usuario → 403 Forbidden
    if (comentario.autor.toString() !== usuarioId) {
      throw new ForbiddenException('No podés editar este comentario');
    }

    return this.comentarioModel
      .findByIdAndUpdate(
        comentarioId,
        {
          contenido: dto.contenido,
          modificado: true, // ← marca que fue editado para que el frontend lo muestre
        },
        { returnDocument: 'after' }, // devuelve el documento ya actualizado
      )
      .populate('autor', 'nombre apellido nombreUsuario fotoPerfil');
  }

  // ── LISTAR COMENTARIOS ────────────────────────────────────────────────────
  async listar(publicacionId: string, offset = 0, limit = 10) {
    // Filtramos por publicación — solo los comentarios de esa publicación
    const filtro = { publicacion: new Types.ObjectId(publicacionId) };

    // countDocuments cuenta sin traer los datos — eficiente para el total
    const total = await this.comentarioModel.countDocuments(filtro);

    const comentarios = await this.comentarioModel
      .find(filtro)
      .sort({ createdAt: -1 })  // más recientes primero
      .skip(offset)             // saltar los ya cargados (paginación)
      .limit(limit)             // cantidad máxima por página
      .populate('autor', 'nombre apellido nombreUsuario fotoPerfil')
      .lean(); // .lean() devuelve objetos JS simples, más rápido que documentos Mongoose

    return { datos: comentarios, total, limit, offset };
  }
}