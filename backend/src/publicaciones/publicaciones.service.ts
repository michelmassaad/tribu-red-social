import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Publicacion, PublicacionDocument } from './schemas/publicacion.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CrearPublicacionDto } from './dto/crear-publicacion.dto';

@Injectable()
export class PublicacionesService {

  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    private cloudinaryService: CloudinaryService,
  ) { }

  // ────────────────────────────────────────────
  // CREAR PUBLICACIÓN
  // ────────────────────────────────────────────
  async crear(dto: CrearPublicacionDto, autorId: string, archivo?: Express.Multer.File) {

    // Si tiene imagen, la subimos a Cloudinary
    let imagenUrl = '';
    let imagenPublicId = '';
    if (archivo) {
      // ✅ Sin transformación de recorte — la imagen se sube respetando su proporción original
      // crop: 'limit' solo achica si supera 1200px de ancho, nunca recorta
      const subida = await this.cloudinaryService.subirImagen(
        archivo,
        'red-social/publicaciones',
        [{ width: 1200, crop: 'limit' }],
      );
      imagenUrl = subida.url;
      imagenPublicId = subida.publicId;
    }

    // Creamos el documento en MongoDB
    const nueva = new this.publicacionModel({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      imagenUrl,
      imagenPublicId,
      autor: new Types.ObjectId(autorId),
    });

    const guardada = await nueva.save();

    // populate('autor') reemplaza el ID del autor por sus datos reales
    return guardada.populate('autor', 'nombre apellido nombreUsuario fotoPerfil');
  }

  // ────────────────────────────────────────────
  // LISTAR PUBLICACIONES
  // ────────────────────────────────────────────
  async listar(offset = 0, limit = 10, ordenarPor = 'fecha', autorId?: string) {

    // Filtro base: solo traer las que no están eliminadas
    const filtro: any = { eliminado: false };

    // Si nos pasan autorId, filtramos solo las de ese usuario
    if (autorId) {
      filtro.autor = new Types.ObjectId(autorId);
    }

    // Traemos las publicaciones ordenadas por fecha (más reciente primero)
    let todasLasPublicaciones = await this.publicacionModel
      .find(filtro)
      .sort({ createdAt: -1 })
      .populate('autor', 'nombre apellido nombreUsuario fotoPerfil')
      .lean();

    // Si nos piden ordenar por likes, ordenamos por cantidad de corazones
    if (ordenarPor === 'likes') {
      todasLasPublicaciones.sort((a, b) => b.likes.length - a.likes.length);
    }

    // Guardamos el total antes de paginar
    const total = todasLasPublicaciones.length;

    // Aplicamos la paginación: skip(offset) y tomamos solo "limit" elementos
    const publicaciones = todasLasPublicaciones.slice(offset, offset + limit);

    return { datos: publicaciones, total, limit, offset };
  }

  // ────────────────────────────────────────────
  // DAR LIKE
  // ────────────────────────────────────────────
  async darLike(publicacionId: string, usuarioId: string) {

    // Buscar la publicación
    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      eliminado: false,
    });
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    // Verificar que el usuario no haya dado like antes
    const yaLeDioLike = publicacion.likes.some(
      id => id.toString() === usuarioId
    );
    if (yaLeDioLike) {
      throw new BadRequestException('Ya le diste like a esta publicación');
    }

    // $addToSet agrega el ID al array solo si no está ya (evita duplicados)
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        { $addToSet: { likes: new Types.ObjectId(usuarioId) } },
        { returnDocument: 'after' }, // ← antes: { new: true }
      )
      .populate('autor', 'nombre apellido nombreUsuario fotoPerfil');
  }

  // ────────────────────────────────────────────
  // QUITAR LIKE
  // ────────────────────────────────────────────
  async quitarLike(publicacionId: string, usuarioId: string) {

    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      eliminado: false,
    });
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    // Verificar que había dado like
    const teniaLike = publicacion.likes.some(
      id => id.toString() === usuarioId
    );
    if (!teniaLike) {
      throw new BadRequestException('No le habías dado like a esta publicación');
    }

    // $pull elimina el ID del array de likes
    return this.publicacionModel
      .findByIdAndUpdate(
        publicacionId,
        { $pull: { likes: new Types.ObjectId(usuarioId) } },
        { returnDocument: 'after' }, // ← antes: { new: true }
      )
      .populate('autor', 'nombre apellido nombreUsuario fotoPerfil');
  }

  // ────────────────────────────────────────────
  // ELIMINAR (baja lógica)
  // ────────────────────────────────────────────
  async eliminar(publicacionId: string, usuarioId: string, perfil: string) {

    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      eliminado: false,
    });
    if (!publicacion) throw new NotFoundException('Publicación no encontrada');

    // Solo puede eliminar el autor o un administrador
    const esElAutor = publicacion.autor.toString() === usuarioId;
    const esAdmin = perfil === 'administrador';

    if (!esElAutor && !esAdmin) {
      throw new ForbiddenException('No podés eliminar esta publicación');
    }

    // No borramos el documento — solo lo marcamos como eliminado
    await this.publicacionModel.findByIdAndUpdate(
      publicacionId,
      { eliminado: true }
    );

    return { mensaje: 'Publicación eliminada correctamente' };
  }
}