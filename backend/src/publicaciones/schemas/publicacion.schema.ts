import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({ timestamps: true })
export class Publicacion {

  @Prop({ required: true })
  titulo: string;

  @Prop({ required: true })
  descripcion: string;

  // URL de imagen en Cloudinary (opcional)
  @Prop({ default: '' })
  imagenUrl: string;

  // ID de Cloudinary para poder borrar la imagen si se borra la publicación
  @Prop({ default: '' })
  imagenPublicId: string;

  // Referencia al usuario que creó la publicación
  // Types.ObjectId + ref: 'Usuario' → permite hacer .populate() para traer los datos del autor
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  // Array de IDs de usuarios que dieron like
  // $addToSet y $pull de MongoDB garantizan que no se repitan
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  likes: Types.ObjectId[];

  // Baja lógica: false = publicación activa, true = eliminada
  @Prop({ default: false })
  eliminado: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);