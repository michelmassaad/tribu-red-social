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

  // transformacion es opcional — cada llamador decide cómo procesar la imagen
  subirImagen(
    archivo: Express.Multer.File,
    carpeta: string,
    transformacion?: object[],
  ): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: carpeta,
          // Solo aplicamos transformación si el caller la pasa
          ...(transformacion ? { transformation: transformacion } : {}),
        },
        (error, resultado) => {
          if (error) return reject(error);
          resolve({
            url: resultado!.secure_url,
            publicId: resultado!.public_id,
          });
        },
      );

      // Enviamos el Buffer al stream — acá es donde se sube realmente
      stream.end(archivo.buffer);
    });
  }

  async eliminarImagen(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}