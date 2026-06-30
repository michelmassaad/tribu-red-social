import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion, PublicacionDocument } from '../publicaciones/schemas/publicacion.schema';
import { Comentario, ComentarioDocument } from '../publicaciones/comentarios/schemas/comentario.schema';

@Injectable()
export class EstadisticasService {

  constructor(
    @InjectModel(Publicacion.name) private publicacionModel: Model<PublicacionDocument>,
    @InjectModel(Comentario.name) private comentarioModel: Model<ComentarioDocument>,
  ) {}

  // ── PUBLICACIONES POR USUARIO ─────────────────────────────────────────
  // Devuelve cuántas publicaciones hizo cada usuario en el rango de fechas.
  // Ejemplo: [{ usuario: "michel", total: 5 }, { usuario: "maria", total: 3 }]
  async publicacionesPorUsuario(desde: string, hasta: string) {
    return this.publicacionModel.aggregate([
      {
        // Filtramos por rango de fechas y excluimos las eliminadas
        $match: {
          eliminado: false,
          createdAt: {
            $gte: new Date(desde),
            $lte: new Date(hasta + 'T23:59:59'),
          },
        },
      },
      {
        // Agrupamos por autor y contamos
        $group: {
          _id: '$autor',
          total: { $sum: 1 },
        },
      },
      {
        // Traemos los datos del usuario desde la colección de usuarios
        $lookup: {
          from: 'usuarios',
          localField: '_id',
          foreignField: '_id',
          as: 'autorData',
        },
      },
      { $unwind: '$autorData' },
      {
        // Solo devolvemos lo que necesita el frontend para el gráfico
        $project: {
          _id: 0,
          usuario: '$autorData.nombreUsuario',
          nombre: { $concat: ['$autorData.nombre', ' ', '$autorData.apellido'] },
          total: 1,
        },
      },
      { $sort: { total: -1 } }, // ordenar de mayor a menor
    ]);
  }

  // ── COMENTARIOS POR DÍA ───────────────────────────────────────────────
  // Devuelve cuántos comentarios se hicieron por día en el rango de fechas.
  // Ejemplo: [{ fecha: "2026-06-01", total: 12 }, { fecha: "2026-06-02", total: 8 }]
  async comentariosPorDia(desde: string, hasta: string) {
    return this.comentarioModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(desde),
            $lte: new Date(hasta + 'T23:59:59'),
          },
        },
      },
      {
        // Agrupamos por día — $dateToString formatea la fecha como "YYYY-MM-DD"
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          fecha: '$_id',
          total: 1,
        },
      },
      { $sort: { fecha: 1 } }, // ordenar cronológicamente
    ]);
  }

  // ── COMENTARIOS POR PUBLICACIÓN ───────────────────────────────────────
  // Devuelve cuántos comentarios tiene cada publicación en el rango de fechas.
  // Ejemplo: [{ titulo: "Viaje a Bari...", total: 15 }, ...]
  async comentariosPorPublicacion(desde: string, hasta: string) {
    return this.comentarioModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(desde),
            $lte: new Date(hasta + 'T23:59:59'),
          },
        },
      },
      {
        $group: {
          _id: '$publicacion',
          total: { $sum: 1 },
        },
      },
      {
        // Traemos el título de la publicación
        $lookup: {
          from: 'publicacions', // nombre de la colección en MongoDB (plural + minúscula)
          localField: '_id',
          foreignField: '_id',
          as: 'pubData',
        },
      },
      { $unwind: '$pubData' },
      {
        $project: {
          _id: 0,
          // Truncamos el título a 30 caracteres para que entre en el gráfico
          titulo: { $substr: ['$pubData.titulo', 0, 30] },
          total: 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 }, // máximo 10 publicaciones para que el gráfico sea legible
    ]);
  }
}