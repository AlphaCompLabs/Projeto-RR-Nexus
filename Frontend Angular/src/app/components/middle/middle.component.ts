/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.4.8
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente 'Middle' (Camada de visualização intermediária).
 * Implementa um IntersectionObserver para criar efeito de fade-in (opacidade)
 * conforme o usuário rola a página.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; 

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-middle',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './middle.component.html',
  styleUrl: './middle.component.css'
})
export class MiddleComponent implements OnInit, OnDestroy {
  
  // --- SEÇÃO 3: PROPRIEDADES ---
  
  /** Controla a opacidade da camada preta (overlay) sobre o componente */
  public overlayOpacity: number = 1.0;
  
  /** Referência interna para o IntersectionObserver */
  private observer: IntersectionObserver | null = null;
  
  /** Referência ao elemento DOM nativo deste componente */
  private element: any;

  // --- SEÇÃO 4: INICIALIZAÇÃO ---
  constructor(private el: ElementRef) {
    this.element = this.el.nativeElement;
  }

  /**
   * Hook de inicialização. Configura o observador de rolagem.
   */
  ngOnInit() {
    this.setupObserver();
  }

  /**
   * Hook de destruição. Limpa o observador para evitar vazamento de memória.
   */
  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  // --- SEÇÃO 5: LÓGICA DE OBSERVAÇÃO (SCROLL) ---

  /**
   * Configura o IntersectionObserver.
   * Calcula a 'intersectionRatio' (quanto do elemento está visível)
   * e ajusta a 'overlayOpacity' inversamente proporcional.
   * * - 0% visível -> Opacidade 1 (Preto)
   * - 100% visível -> Opacidade 0 (Transparente/Visível)
   */
  private setupObserver() {
    const options = {
      root: null, // Observa em relação ao viewport do navegador
      // Array de thresholds para suavizar a transição
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    };

    this.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      // A mágica acontece aqui: Inversão do ratio para opacidade
      this.overlayOpacity = 1 - entry.intersectionRatio;
    }, options);

    this.observer.observe(this.element);
  }
}