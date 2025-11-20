/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.7
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para a LoginPage.
 * Verifica a alternância de interface (Formulário vs Mensagem) baseada no login.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

// Importamos os componentes REAIS para removê-los no override
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { MiddleComponent } from '../../components/middle/middle.component';

// --- SEÇÃO 2: MOCKS (COMPONENTES FILHOS) ---
@Component({selector: 'app-login-form', standalone: true, template: ''})
class MockLoginFormComponent {}

@Component({selector: 'app-middle', standalone: true, template: ''})
class MockMiddleComponent {}

// --- SEÇÃO 3: SUÍTE DE TESTES ---
describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let isLoggedInSubject: BehaviorSubject<boolean>;

  // --- SEÇÃO 4: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    isLoggedInSubject = new BehaviorSubject<boolean>(false);
    
    const authServiceMock = {
      isLoggedIn$: isLoggedInSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage], 
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    })
    // Substituição dos componentes filhos reais por Mocks para isolar o teste da página
    .overrideComponent(LoginPage, {
      remove: { imports: [LoginFormComponent, MiddleComponent] },
      add: { imports: [MockLoginFormComponent, MockMiddleComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criada', () => {
    expect(component).toBeTruthy();
  });

  // --- SEÇÃO 5: TESTES VISUAIS (NÃO LOGADO) ---

  it('deve mostrar o formulário de login quando NÃO estiver logado', () => {
    // Estado: Não logado
    isLoggedInSubject.next(false);
    fixture.detectChanges();

    // Procura pela tag do componente mockado
    const loginForm = fixture.debugElement.query(By.css('app-login-form'));
    expect(loginForm).toBeTruthy();

    // Garante que a mensagem de sucesso NÃO está lá
    const authMessage = fixture.debugElement.query(By.css('h2.text-nexus-pink-light'));
    if (authMessage) {
        expect(authMessage.nativeElement.textContent).not.toContain('Você já está autenticado');
    }
  });

  // --- SEÇÃO 6: TESTES VISUAIS (LOGADO) ---

  it('deve mostrar a mensagem de autenticado quando ESTIVER logado', () => {
    // Estado: Logado
    isLoggedInSubject.next(true);
    fixture.detectChanges(); 

    // O formulário deve sumir
    const loginForm = fixture.debugElement.query(By.css('app-login-form'));
    expect(loginForm).toBeFalsy();

    // A mensagem deve aparecer
    const authMessage = fixture.debugElement.query(By.css('h2'));
    expect(authMessage).toBeTruthy();
    expect(authMessage.nativeElement.textContent).toContain('Você já está autenticado');
  });
});