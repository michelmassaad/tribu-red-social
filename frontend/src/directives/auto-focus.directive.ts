import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements OnInit {

  constructor(private el: ElementRef) {}

  ngOnInit() {
    // Pequeño delay para que el DOM esté listo
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 100);
  }
}