import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({ timestamps: true }) // agrega createdAt y updatedAt automáticamente
export class Comentario {

  // Referencia a la publicación — con esto sabemos a qué publicación pertenece
  // sin tener que repetir los datos de la publicación en cada comentario
  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true })
  publicacion: Types.ObjectId;

  // Referencia al usuario que escribió el comentario
  // ref: 'Usuario' permite hacer .populate() para traer nombre/foto
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  autor: Types.ObjectId;

  // El texto del comentario — máximo 500 caracteres
  @Prop({ required: true, maxlength: 500 })
  contenido: string;

  // Cuando el usuario edita su comentario, este campo pasa a true.
  // El frontend lo usa para mostrar el badge "editado" debajo del comentario.
  @Prop({ default: false })
  modificado: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);