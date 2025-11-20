import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MiddleComponent } from './middle.component';
import { By } from '@angular/platform-browser';

describe('MiddleComponent', () => {
  let component: MiddleComponent;
  let fixture: ComponentFixture<MiddleComponent>;

  // Variáveis para capturar o funcionamento interno do Observer
  let observerCallback: any;
  let mockObserverInstance: any;

  beforeEach(async () => {
    // 1. Mock Avançado do IntersectionObserver
    // Ele captura a função de callback para podermos chamá-la manualmente nos testes
    const IntersectionObserverMock = class {
      constructor(callback: any) {
        observerCallback = callback;
        mockObserverInstance = this;
      }
      observe = jasmine.createSpy('observe');
      disconnect = jasmine.createSpy('disconnect');
    };

    // Substitui o original do navegador pelo nosso Mock
    (window as any).IntersectionObserver = IntersectionObserverMock;

    await TestBed.configureTestingModule({
      imports: [MiddleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiddleComponent);
    component = fixture.componentInstance;
    
    // O detectChanges dispara o ngOnInit -> que cria o Observer -> que preenche observerCallback
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve começar observando o elemento', () => {
    // Verifica se o método .observe() foi chamado no elemento nativo
    expect(mockObserverInstance.observe).toHaveBeenCalledWith(component['element']);
  });

  // --- TESTES DA LÓGICA DO CALLBACK (O que faltava!) ---

  it('deve calcular opacidade correta quando elemento está 0% visível (intersectionRatio = 0)', () => {
    // Simulamos o evento do navegador
    const mockEntry = { intersectionRatio: 0 }; 
    
    // Disparamos o callback manualmente
    observerCallback([mockEntry]);

    // Lógica: opacity = 1 - 0 = 1
    expect(component.overlayOpacity).toBe(1);
  });

  it('deve calcular opacidade correta quando elemento está 50% visível (intersectionRatio = 0.5)', () => {
    const mockEntry = { intersectionRatio: 0.5 };
    observerCallback([mockEntry]);

    // Lógica: opacity = 1 - 0.5 = 0.5
    expect(component.overlayOpacity).toBe(0.5);
  });

  it('deve ficar totalmente transparente quando 100% visível (intersectionRatio = 1)', () => {
    const mockEntry = { intersectionRatio: 1.0 };
    observerCallback([mockEntry]);

    // Lógica: opacity = 1 - 1 = 0
    expect(component.overlayOpacity).toBe(0);
  });

  // --- TESTE DO NGONDESTROY ---

  it('deve desconectar o observer ao destruir o componente', () => {
    // Dispara a destruição do componente
    fixture.destroy(); 
    
    // Verifica se o método .disconnect() foi chamado para evitar memory leak
    expect(mockObserverInstance.disconnect).toHaveBeenCalled();
  });
});