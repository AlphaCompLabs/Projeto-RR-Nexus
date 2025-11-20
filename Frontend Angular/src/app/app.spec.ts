/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.2.1
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o AppComponent.
 * Verifica a criação, título e lógica de exibição de Header/Footer por rota.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Component } from '@angular/core';

// Importa os componentes reais para removê-los no override
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

// --- SEÇÃO 2: MOCKS (COMPONENTES FILHOS) ---
@Component({selector: 'app-header', standalone: true, template: ''})
class MockHeaderComponent {}

@Component({selector: 'app-footer', standalone: true, template: ''})
class MockFooterComponent {}

@Component({selector: 'dummy-cmp', standalone: true, template: ''})
class DummyComponent {}

// --- SEÇÃO 3: SUÍTE DE TESTES ---
describe('AppComponent', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  // --- SEÇÃO 4: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    // Mock do AuthService com o BehaviorSubject appLoading$
    const authSpy = jasmine.createSpyObj('AuthService', ['validateSessionOnLoad'], {
      appLoading$: new BehaviorSubject<boolean>(false)
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([
          { path: 'meu-perfil', component: DummyComponent },
          { path: 'outra', component: DummyComponent }
        ])
      ]
    })
    .overrideComponent(App, {
      // Remove os reais e adiciona os mocks para isolar o teste
      remove: { imports: [HeaderComponent, FooterComponent] },
      add: { imports: [MockHeaderComponent, MockFooterComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  // --- SEÇÃO 5: TESTES ESTRUTURAIS ---

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it(`deve ter o título 'projeto-rr-nexus'`, () => {
    expect(component['title']()).toEqual('projeto-rr-nexus');
  });

  it('deve chamar validateSessionOnLoad no início (ngOnInit)', () => {
    expect(authServiceSpy.validateSessionOnLoad).toHaveBeenCalled();
  });

  // --- SEÇÃO 6: TESTES DE ROTEAMENTO E UI ---

  it('deve ESCONDER header/footer na rota "/meu-perfil"', async () => {
    await router.navigate(['/meu-perfil']);
    fixture.detectChanges();
    expect(component.showHeaderFooter).toBeFalse();
  });

  it('deve MOSTRAR header/footer em outras rotas', async () => {
    await router.navigate(['/outra']);
    fixture.detectChanges();
    expect(component.showHeaderFooter).toBeTrue();
  });
});