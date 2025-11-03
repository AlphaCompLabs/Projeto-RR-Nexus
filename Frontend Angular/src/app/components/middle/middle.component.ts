// 1. Importe OnInit e OnDestroy
import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-middle',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './middle.component.html',
  styleUrl: './middle.component.css'
})
// 2. Implemente as novas interfaces
export class MiddleComponent implements OnInit, OnDestroy {
  
  public overlayOpacity: number = 1.0;
  
  // 3. Propriedade para guardar o nosso Observer
  private observer: IntersectionObserver | null = null;
  private element: any;

  constructor(private el: ElementRef) {
    this.element = this.el.nativeElement;
  }

  // 4. ngOnInit roda quando o componente é criado
  ngOnInit() {
    this.setupObserver();
  }

  // 5. ngOnDestroy roda quando o componente é destruído
  ngOnDestroy() {
    // Limpa o observer para evitar memory leaks
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // 6. Esta é a nova lógica
  private setupObserver() {
    
    // Opções: queremos saber a porcentagem de visibilidade
    const options = {
      root: null, // (observa em relação ao viewport)
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    // Cria o observer
    this.observer = new IntersectionObserver((entries) => {
      
      // entries[0] é o nosso <app-middle>
      const entry = entries[0];
      
      // intersectionRatio é a porcentagem (0.0 a 1.0)
      // do elemento que está visível na tela.
      
      // Invertemos: se 100% visível (1.0), opacidade é 0.
      // Se 0% visível (0.0), opacidade é 1.
      this.overlayOpacity = 1 - entry.intersectionRatio;

    }, options);

    // Começa a "observar" o elemento do componente
    this.observer.observe(this.element);
  }
}