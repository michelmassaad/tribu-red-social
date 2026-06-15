import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

// timestamps: true → MongoDB agrega createdAt y updatedAt automáticamente
@Schema({ timestamps: true })
export class Usuario {

  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  apellido: string;

  // unique: true → MongoDB rechaza correos repetidos
  // lowercase: true → siempre guarda en minúsculas
  @Prop({ required: true, unique: true, lowercase: true })
  correo: string;

  @Prop({ required: true, unique: true })
  nombreUsuario: string;

  @Prop({ required: true })
  password: string; // ← Acá va el HASH, NUNCA el texto plano

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop({ default: '' })
  descripcionBreve: string;

  // URL pública de Cloudinary: https://res.cloudinary.com/...
  @Prop({ default: '' })
  fotoPerfil: string;

  // ID de Cloudinary — lo guardamos para poder borrar/reemplazar la foto más adelante
  @Prop({ default: '' })
  fotoPerfilPublicId: string;

  // 'usuario' por defecto, puede ser 'administrador'
  @Prop({ default: 'usuario', enum: ['usuario', 'administrador'] })
  perfil: string;

  @Prop({ default: true })
  activo: boolean;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);