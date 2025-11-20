import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { AuthService } from '../../services/auth.service';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Component } from '@angular/core';

// 1. Importamos os componentes REAIS para poder removê-los no override
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { MiddleComponent } from '../../components/middle/middle.component';

// 2. Criamos Mocks (Dummies) para os filhos
@Component({selector: 'app-login-form', standalone: true, template: ''})
class MockLoginFormComponent {}

@Component({selector: 'app-middle', standalone: true, template: ''})
class MockMiddleComponent {}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let isLoggedInSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isLoggedInSubject = new BehaviorSubject<boolean>(false);
    
    const authServiceMock = {
      isLoggedIn$: isLoggedInSubject.asObservable()
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage], // Importa apenas a Page
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        provideRouter([])
      ]
    })
    // 3. Substituição Crucial: Tira os componentes reais, põe os mocks
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

  it('deve mostrar o formulário de login quando NÃO estiver logado', () => {
    // Estado: Não logado
    isLoggedInSubject.next(false);
    fixture.detectChanges();

    // Procura pela tag do componente mockado
    const loginForm = fixture.debugElement.query(By.css('app-login-form'));
    expect(loginForm).toBeTruthy();

    // Garante que a mensagem de sucesso NÃO está lá
    const authMessage = fixture.debugElement.query(By.css('h2.text-nexus-pink-light'));
    // O texto "Você já está autenticado" só existe no bloco @else
    if (authMessage) {
        expect(authMessage.nativeElement.textContent).not.toContain('Você já está autenticado');
    }
  });

  it('deve mostrar a mensagem de autenticado quando ESTIVER logado', () => {
    // Estado: Logado
    isLoggedInSubject.next(true);
    fixture.detectChanges(); // Atualiza o HTML (processa o pipe async)

    // O formulário deve sumir
    const loginForm = fixture.debugElement.query(By.css('app-login-form'));
    expect(loginForm).toBeFalsy();

    // A mensagem deve aparecer
    const authMessage = fixture.debugElement.query(By.css('h2'));
    expect(authMessage).toBeTruthy();
    expect(authMessage.nativeElement.textContent).toContain('Você já está autenticado');
  });
});