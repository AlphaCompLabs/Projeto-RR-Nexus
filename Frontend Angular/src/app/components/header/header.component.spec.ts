/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.2.5
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários do HeaderComponent (navegação e estado reativo).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  
  // Mocks e Spies
  let authServiceSpy: any;
  let routerSpy: jasmine.SpyObj<Router>;
  let scrollerSpy: jasmine.SpyObj<ViewportScroller>;
  
  let isLoggedInSubject: BehaviorSubject<boolean>;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    // 1. Configura o estado inicial (deslogado)
    isLoggedInSubject = new BehaviorSubject<boolean>(false);

    // 2. Cria os Mocks
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
    fixture.detectChanges(); 
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // --- SEÇÃO 4: TESTES DE ESTADO (DESLOGADO) ---

  it('deve iniciar como deslogado e mostrar o botão "LOGIN"', () => {
    expect(component.isLoggedIn).toBeFalse();
    
    // Procura pelo elemento <a> (botão de login)
    const loginButton = fixture.debugElement.query(By.css('a')); 
    expect(loginButton).toBeTruthy();
    expect(loginButton.nativeElement.textContent).toContain('LOGIN');
  });

  it('deve chamar o scroller ao clicar em "LOGIN"', () => {
    const loginButton = fixture.debugElement.query(By.css('a'));
    loginButton.triggerEventHandler('click', null);

    // Verifica se chamou a função de âncora
    expect(scrollerSpy.scrollToAnchor).toHaveBeenCalledWith('login-form-section');
  });

  // --- SEÇÃO 5: TESTES DE ESTADO (LOGADO) ---

  it('deve mostrar o botão "PERFIL" quando o usuário estiver logado', () => {
    // Simula o login mudando o valor do Subject
    isLoggedInSubject.next(true);
    fixture.detectChanges(); // Atualiza a view

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

    // Verifica navegação
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meu-perfil']);
  });
});