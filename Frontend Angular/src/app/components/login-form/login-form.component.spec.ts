import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent } from './login-form.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ElementRef } from '@angular/core';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'register', 'resetPassword']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Configuração padrão: Sucesso em tudo
    authSpy.login.and.returnValue(of(true));
    authSpy.register.and.returnValue(of({ success: true }));
    authSpy.resetPassword.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [LoginFormComponent, FormsModule, CommonModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // ==========================================================================
  // 1. TESTES DE INTERFACE E VISIBILIDADE (TOGGLES)
  // ==========================================================================

  it('deve alternar a visibilidade da senha de login', () => {
    component.showPassword = false;
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeFalse();
  });

  it('deve alternar a visibilidade da senha de cadastro', () => {
    component.showSignUpPassword = false;
    component.toggleSignUpPasswordVisibility();
    expect(component.showSignUpPassword).toBeTrue();
  });

  it('deve alternar a visibilidade da nova senha (reset)', () => {
    component.showNewPassword = false;
    component.toggleNewPasswordVisibility();
    expect(component.showNewPassword).toBeTrue();
  });

  // ==========================================================================
  // 2. TESTES DE LOGIN (Validacao e Lógica)
  // ==========================================================================

  it('NÃO deve chamar login se os campos estiverem vazios', () => {
    component.username = '';
    component.password = '';
    
    component.onLogin();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.loginErrorMessage).toBe('Insira usuário e senha.');
  });

  it('deve chamar login com sucesso', () => {
    component.username = 'elisa';
    component.password = '123456';
    
    component.onLogin();

    expect(authServiceSpy.login).toHaveBeenCalledWith('elisa', '123456');
    expect(component.loginErrorMessage).toBe('');
  });

  it('deve mostrar erro se login falhar (retorno false)', () => {
    component.username = 'elisa';
    component.password = 'errada';
    authServiceSpy.login.and.returnValue(of(false)); // Simula falha

    component.onLogin();

    expect(component.loginErrorMessage).toBe('Usuário ou senha não encontrado.');
  });

  // ==========================================================================
  // 3. TESTES DO POP-UP "ESQUECI MINHA SENHA"
  // ==========================================================================

  it('deve abrir e fechar o modal de Esqueci Senha corretamente', () => {
    const event = new Event('click'); // Simula o evento do mouse
    
    component.openForgotPassword(event);
    expect(component.showForgotPassword).toBeTrue();
    expect(component.forgotPasswordStep).toBe(1);

    component.closeForgotPassword();
    expect(component.showForgotPassword).toBeFalse();
    expect(component.forgotUsername).toBe(''); // Verifica se limpou os campos
  });

  it('NÃO deve resetar senha se campos vazios', () => {
    component.forgotUsername = '';
    component.newPassword = '';
    
    component.onResetPassword();

    expect(authServiceSpy.resetPassword).not.toHaveBeenCalled();
    expect(component.showPasswordMessage).toContain('preencha');
  });

  it('deve chamar resetPassword com sucesso e mudar de passo', () => {
    component.forgotUsername = 'user';
    component.newPassword = 'newPass';

    component.onResetPassword();

    expect(authServiceSpy.resetPassword).toHaveBeenCalled();
    expect(component.forgotPasswordStep).toBe(2);
  });

  it('deve tratar erro no resetPassword (ex: usuário não existe)', () => {
    component.forgotUsername = 'fantasma';
    component.newPassword = '123';
    
    // Simula erro do backend
    authServiceSpy.resetPassword.and.returnValue(throwError(() => ({ error: { error: 'Usuário não encontrado' } })));

    component.onResetPassword();

    expect(component.showPasswordMessage).toBe('Usuário não encontrado');
  });

  it('deve tratar erro desconhecido no resetPassword', () => {
    component.forgotUsername = 'user';
    component.newPassword = '123';
    authServiceSpy.resetPassword.and.returnValue(throwError(() => ({ error: {} }))); // Erro sem mensagem

    component.onResetPassword();

    expect(component.showPasswordMessage).toBe('Ocorreu um erro desconhecido.');
  });

  it('deve fechar o modal ao concluir (onConclude)', () => {
    component.showForgotPassword = true;
    component.onConclude();
    expect(component.showForgotPassword).toBeFalse();
  });

  // ==========================================================================
  // 4. TESTES DO POP-UP "CADASTRO" (SIGN UP)
  // ==========================================================================

  it('deve abrir e fechar o modal de Cadastro', () => {
    const event = new Event('click');
    component.openSignUp(event);
    expect(component.showSignUp).toBeTrue();

    component.closeSignUp();
    expect(component.showSignUp).toBeFalse();
    expect(component.signUpUsername).toBe('');
  });

  it('NÃO deve cadastrar se campos vazios', () => {
    component.signUpUsername = '';
    component.onSignUp();
    expect(component.signUpMessage).toContain('preencha');
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('NÃO deve cadastrar se senha curta (< 6)', () => {
    component.signUpUsername = 'teste';
    component.signUpPassword = '123'; // Curta
    component.onSignUp();
    expect(component.signUpMessage).toContain('6 caracteres');
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('deve cadastrar com sucesso', () => {
    component.signUpUsername = 'novo';
    component.signUpPassword = '1234567';
    component.onSignUp();
    expect(authServiceSpy.register).toHaveBeenCalled();
    expect(component.signUpStep).toBe(2);
  });

  it('deve tratar erro de cadastro (ex: usuário já existe)', () => {
    component.signUpUsername = 'existente';
    component.signUpPassword = '1234567';
    authServiceSpy.register.and.returnValue(throwError(() => ({ error: { error: 'Já existe' } })));

    component.onSignUp();
    expect(component.signUpMessage).toBe('Já existe');
  });

  it('deve fechar modal ao concluir cadastro', () => {
    component.showSignUp = true;
    component.onSignUpConclude();
    expect(component.showSignUp).toBeFalse();
  });

  // ==========================================================================
  // 5. TESTES DE TECLADO E FOCO (ViewChilds)
  // ==========================================================================

  it('deve focar no campo de senha ao dar enter no usuario', () => {
    // Mockamos o ElementRef nativo
    const mockElementRef = { nativeElement: { focus: jasmine.createSpy('focus') } };
    component.passwordField = mockElementRef as unknown as ElementRef;

    const event = new Event('keydown');
    spyOn(event, 'preventDefault'); // Verifica se preveniu o default

    component.focusPassword(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockElementRef.nativeElement.focus).toHaveBeenCalled();
  });

  it('deve focar no campo de senha de cadastro ao dar enter no usuario', () => {
    const mockElementRef = { nativeElement: { focus: jasmine.createSpy('focus') } };
    component.signUpPasswordField = mockElementRef as unknown as ElementRef;

    const event = new Event('keydown');
    component.focusSignUpPassword(event);

    expect(mockElementRef.nativeElement.focus).toHaveBeenCalled();
  });

  it('deve simular clique no botão ao dar enter (Login)', () => {
    const mockButton = jasmine.createSpyObj('HTMLButtonElement', ['click']);
    const event = new Event('keydown');
    
    component.onLoginEnter(event, mockButton);

    expect(mockButton.click).toHaveBeenCalled();
  });

  it('deve simular clique no botão ao dar enter (Esqueci Senha)', () => {
    const mockButton = jasmine.createSpyObj('HTMLButtonElement', ['click']);
    const event = new Event('keydown');
    
    component.onFindPasswordEnter(event, mockButton);

    expect(mockButton.click).toHaveBeenCalled();
  });

  it('deve simular clique no botão ao dar enter (Cadastro)', () => {
    const mockButton = jasmine.createSpyObj('HTMLButtonElement', ['click']);
    const event = new Event('keydown');
    
    component.onSignUpEnter(event, mockButton);

    expect(mockButton.click).toHaveBeenCalled();
  });

  // ==========================================================================
  // 6. O "PULO DO GATO" PARA O 100% (TESTES DE SEGURANÇA / SAFETY CHECKS)
  // ==========================================================================

  it('NÃO deve tentar focar no campo de senha se ele não existir (undefined)', () => {
    // Forçamos o ViewChild a ser undefined para testar o "if (this.passwordField)" dando false
    component.passwordField = undefined as any;
    
    const event = new Event('keydown');
    spyOn(event, 'preventDefault');

    // Executa a função. Se não quebrar e chamar o preventDefault, o teste passa.
    component.focusPassword(event);

    expect(event.preventDefault).toHaveBeenCalled();
    // Não esperamos que focus() seja chamado, pois o elemento não existe
  });

  it('NÃO deve tentar focar na senha de cadastro se o elemento não existir', () => {
    component.signUpPasswordField = undefined as any;
    
    const event = new Event('keydown');
    spyOn(event, 'preventDefault');

    component.focusSignUpPassword(event);

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('deve tratar erro DESCONHECIDO no cadastro (cobre o else do tratamento de erro)', () => {
    component.signUpUsername = 'user';
    component.signUpPassword = '123456';

    // Simulamos um erro que NÃO tem a estrutura padrão { error: { error: '...' } }
    // Isso força o código a cair no "else { this.signUpMessage = 'Ocorreu um erro desconhecido.' }"
    const erroBizarro = { status: 500, statusText: 'Server Error' }; 
    authServiceSpy.register.and.returnValue(throwError(() => erroBizarro));

    component.onSignUp();

    expect(component.signUpMessage).toBe('Ocorreu um erro desconhecido.');
  });

});