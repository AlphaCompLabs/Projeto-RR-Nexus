import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  
  // Spies (espiões) para simular as dependências
  let authServiceSpy: any;
  let routerSpy: jasmine.SpyObj<Router>;
  let scrollerSpy: jasmine.SpyObj<ViewportScroller>;
  
  // Subject para controlar o estado de login durante o teste
  let isLoggedInSubject: BehaviorSubject<boolean>;

  beforeEach(async () => {
    // 1. Configura o estado inicial (deslogado)
    isLoggedInSubject = new BehaviorSubject<boolean>(false);

    // 2. Cria os Mocks (Simulações)
    authServiceSpy = {
      isLoggedIn$: isLoggedInSubject.asObservable()
    };
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    scrollerSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToAnchor']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ViewportScroller, useValue: scrollerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara o ngOnInit
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // --- Testes de Estado DESLOGADO ---

  it('deve iniciar como deslogado e mostrar o botão "LOGIN"', () => {
    expect(component.isLoggedIn).toBeFalse();
    
    // Procura pelo texto "LOGIN" no template
    const loginButton = fixture.debugElement.query(By.css('a')); // O botão de login é um <a>
    expect(loginButton).toBeTruthy();
    expect(loginButton.nativeElement.textContent).toContain('LOGIN');
  });

  it('deve chamar o scroller ao clicar em "LOGIN"', () => {
    const loginButton = fixture.debugElement.query(By.css('a'));
    loginButton.triggerEventHandler('click', null);

    expect(scrollerSpy.scrollToAnchor).toHaveBeenCalledWith('login-form-section');
  });

  // --- Testes de Estado LOGADO ---

  it('deve mostrar o botão "PERFIL" quando o usuário estiver logado', () => {
    // Simula o login mudando o valor do Subject
    isLoggedInSubject.next(true);
    fixture.detectChanges(); // Atualiza o HTML

    expect(component.isLoggedIn).toBeTrue();

    // O botão antigo (<a>) deve sumir
    const loginLink = fixture.debugElement.query(By.css('a'));
    expect(loginLink).toBeFalsy();

    // O novo botão (<button>) deve aparecer
    const profileButton = fixture.debugElement.query(By.css('button'));
    expect(profileButton).toBeTruthy();
    expect(profileButton.nativeElement.textContent).toContain('PERFIL');
  });

  it('deve navegar para "/meu-perfil" ao clicar em "PERFIL"', () => {
    // Loga o usuário
    isLoggedInSubject.next(true);
    fixture.detectChanges();

    // Clica no botão
    const profileButton = fixture.debugElement.query(By.css('button'));
    profileButton.triggerEventHandler('click', null);

    // Verifica se o roteador foi chamado
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meu-perfil']);
  });
});