import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'primeraMayuscula', standalone: true })
export class PrimeraMayusculaPipe implements PipeTransform {

  transform(texto: string): string {
    if (!texto) return '';
    // Capitaliza la primera letra de cada palabra
    return texto
      .toLowerCase()
      .split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }
}