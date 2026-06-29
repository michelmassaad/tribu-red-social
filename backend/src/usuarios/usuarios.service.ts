// Este servicio es el único que toca MongoDB directamente.
// El AuthService lo usa para buscar y crear usuarios.
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuario.schema';

@Injectable()
export class UsuariosService {

  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>
  ) {}

  async buscarPorCorreo(correo: string) {
    return this.usuarioModel.findOne({ correo: correo.toLowerCase() });
  }

  async buscarPorNombreUsuario(nombreUsuario: string) {
    return this.usuarioModel.findOne({ nombreUsuario });
  }

  async buscarPorId(id: string) {
    return this.usuarioModel.findById(id);
  }

  async crear(datos: Partial<Usuario>) {
    const nuevo = new this.usuarioModel(datos);
    return nuevo.save();
  }

  async actualizarCampos(id: string, campos: Partial<Usuario>) {
        return await this.usuarioModel.findByIdAndUpdate(
            id,
            { $set: campos },
            { new: true }, // Esto hace que retorne el usuario ya modificado y no el viejo
        );
    }
}