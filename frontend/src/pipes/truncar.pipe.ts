import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncar', standalone: true })
export class TruncarPipe implements PipeTransform {

  // limite: cantidad máxima de caracteres (por defecto 100)
  transform(texto: string, limite = 100): string {
    if (!texto) return '';
    if (texto.length <= limite) return texto;
    return texto.substring(0, limite).trim() + '...';
  }
}