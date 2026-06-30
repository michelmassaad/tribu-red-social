import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickFuera]',
  standalone: true,
})
export class ClickFueraDirective {

  @Output() appClickFuera = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  // Escucha todos los clicks del documento
  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    // Si el click fue FUERA de este elemento, emite el evento
    if (!this.el.nativeElement.contains(event.target)) {
      this.appClickFuera.emit();
    }
  }
}