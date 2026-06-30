import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fechaRelativa', standalone: true })
export class FechaRelativaPipe implements PipeTransform {

  transform(fecha: string | Date): string {
    const ahora = new Date();
    const antes = new Date(fecha);
    const diff = Math.floor((ahora.getTime() - antes.getTime()) / 1000); // diferencia en segundos

    // Si es menor que un minuto, devuelve "hace un momento"
    if (diff < 60) return 'hace un momento';
    // Si es menor que un hora, devuelve "hace X minutos"
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} minutos`;
    // Si es menor que una día, devuelve "hace X horas"
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} horas`;
    // Si es menor que un mes, devuelve "hace X días"
    if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`;
    // Si es menor que un año, devuelve "hace X meses"
    if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`;
    // Si es mayor que un año, devuelve "hace X años"
    return `hace${Math.floor(diff / 31536000)} años`;
  }
}