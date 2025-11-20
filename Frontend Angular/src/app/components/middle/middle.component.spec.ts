/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.5
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o MiddleComponent.
 * Foca na lógica do IntersectionObserver (cálculo de opacidade).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MiddleComponent } from './middle.component';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('MiddleComponent', () => {
  let component: MiddleComponent;
  let fixture: ComponentFixture<MiddleComponent>;

  // Variáveis para capturar o funcionamento interno do Mock do Observer
  let observerCallback: any;
  let mockObserverInstance: any;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    
    // 1. Mock Avançado do IntersectionObserver
    // Captura a função de callback para podermos disparar eventos manualmente
    const IntersectionObserverMock = class {
      constructor(callback: any) {
        observerCallback = callback;
        mockObserverInstance = this;
      }
      observe = jasmine.createSpy('observe');
      disconnect = jasmine.createSpy('disconnect');
    };

    // Substitui o observer original do navegador pelo nosso Mock
    (window as any).IntersectionObserver = IntersectionObserverMock;

    await TestBed.configureTestingModule({
      imports: [MiddleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiddleComponent);
    component = fixture.componentInstance;
    
    // Dispara ngOnInit -> cria Observer -> preenche observerCallback
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve começar observando o elemento', () => {
    expect(mockObserverInstance.observe).toHaveBeenCalledWith(component['element']);
  });

  // --- SEÇÃO 4: TESTES DA LÓGICA DE VISIBILIDADE ---

  it('deve calcular opacidade 1 (escuro) quando elemento está 0% visível', () => {
    const mockEntry = { intersectionRatio: 0 }; 
    observerCallback([mockEntry]); // Dispara evento

    // opacity = 1 - 0 = 1
    expect(component.overlayOpacity).toBe(1);
  });

  it('deve calcular opacidade 0.5 quando elemento está 50% visível', () => {
    const mockEntry = { intersectionRatio: 0.5 };
    observerCallback([mockEntry]);

    // opacity = 1 - 0.5 = 0.5
    expect(component.overlayOpacity).toBe(0.5);
  });

  it('deve ficar totalmente transparente (0) quando 100% visível', () => {
    const mockEntry = { intersectionRatio: 1.0 };
    observerCallback([mockEntry]);

    // opacity = 1 - 1 = 0
    expect(component.overlayOpacity).toBe(0);
  });

  // --- SEÇÃO 5: TESTES DE LIMPEZA ---

  it('deve desconectar o observer ao destruir o componente', () => {
    fixture.destroy(); 
    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
  });
});