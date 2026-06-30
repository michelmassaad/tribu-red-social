import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective implements OnInit {
  // Color de fondo al hacer hover — configurable desde el template
  @Input() appHighlight = 'rgba(99, 102, 241, 0.08)';

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Establecer transición y cursor al hacer hover
    this.el.nativeElement.style.transition = 'background-color 0.2s';
    // Establecer cursor al hacer hover
    this.el.nativeElement.style.cursor = 'pointer';
  }

  // Eventos de mouse para cambiar el color de fondo al hacer hover
  @HostListener('mouseenter')
  onMouseEnter() {
    // Cambiar el color de fondo al hacer hover
    this.el.nativeElement.style.backgroundColor = this.appHighlight;
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    // Restaurar el color de fondo original al salir del ratón
    this.el.nativeElement.style.backgroundColor = 'transparent';
  }
}