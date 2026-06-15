// Este servicio hace una sola cosa: recibe la foto en RAM (Buffer)
// y la sube a Cloudinary, devolviendo la URL pública.
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {

  constructor() {
    // Configuramos Cloudinary con las credenciales del .env
    // Esto se ejecuta una sola vez cuando arranca el servidor
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  subirImagen(archivo: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    // Cloudinary no acepta Buffer directamente, necesita un stream
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'red-social/perfiles', // Carpeta dentro de tu cuenta de Cloudinary
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          ],
        },
        (error, resultado) => {
          if (error) return reject(error);
          resolve({
            url: resultado!.secure_url,    // URL pública HTTPS de la imagen
            publicId: resultado!.public_id, // ID para borrarla después si hace falta
          });
        },
      );

      // Enviamos el Buffer al stream — acá es donde se sube realmente
      stream.end(archivo.buffer);
    });
  }

  // Útil en Sprint #4 cuando necesitemos reemplazar la foto de perfil
  async eliminarImagen(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}