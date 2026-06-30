// Este servicio es el único que toca MongoDB directamente.
// El AuthService lo usa para buscar y crear usuarios.
import { Injectable, NotFoundException } from '@nestjs/common';
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

  // En usuarios.service.ts — agregar estos métodos:

// ── LISTAR TODOS ──────────────────────────────────────────────────────────
// No incluye el campo password en la respuesta
async listarTodos() {
  return this.usuarioModel
    .find({}, { password: 0 }) // { password: 0 } excluye el campo password
    .sort({ createdAt: -1 })
    .lean();
}

// ── DESHABILITAR (baja lógica) ────────────────────────────────────────────
// Pone activo: false — el login verifica este campo y rechaza con 401
async deshabilitar(id: string) {
  const usuario = await this.usuarioModel.findById(id);
  if (!usuario) throw new NotFoundException('Usuario no encontrado');
  await this.usuarioModel.findByIdAndUpdate(id, { activo: false });
  return { mensaje: 'Usuario deshabilitado correctamente' };
}

// ── HABILITAR (alta lógica) ───────────────────────────────────────────────
// Vuelve a poner activo: true
async habilitar(id: string) {
  const usuario = await this.usuarioModel.findById(id);
  if (!usuario) throw new NotFoundException('Usuario no encontrado');
  await this.usuarioModel.findByIdAndUpdate(id, { activo: true });
  return { mensaje: 'Usuario habilitado correctamente' };
}

}