/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.8.4
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente responsável pelo formulário de autenticação (Login),
 * recuperação de senha e cadastro de novos usuários.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  
  // --- SEÇÃO 3: PROPRIEDADES DO LOGIN ---
  public username: string = '';
  public password: string = '';
  public showPassword: boolean = false;
  public loginErrorMessage: string = ''; 
  
  /** Referência ao input de senha para focar via teclado */
  @ViewChild('passwordInput') passwordField!: ElementRef;
  @ViewChild('signUpPasswordInput') signUpPasswordField!: ElementRef;

  // --- SEÇÃO 4: PROPRIEDADES DE RECUPERAÇÃO DE SENHA ---
  public showForgotPassword: boolean = false;
  public forgotPasswordStep: number = 1;
  public forgotUsername: string = '';
  public foundPassword: string = '';
  public foundUsernameDisplay: string = '';
  public showPasswordMessage: string = '';
  public newPassword: string = '';
  public showNewPassword: boolean = false;

  // --- SEÇÃO 5: PROPRIEDADES DE CADASTRO (SIGN UP) ---
  public showSignUp: boolean = false;
  public signUpStep: number = 1;
  public signUpUsername: string = '';
  public signUpPassword: string = '';
  public signUpMessage: string = '';
  public showSignUpPassword: boolean = false;

  // --- SEÇÃO 6: INICIALIZAÇÃO ---
  constructor(
    private router: Router,
    private authService: AuthService 
  ) { }

  // --- SEÇÃO 7: LÓGICA DE LOGIN ---

  /**
   * Executa a tentativa de login chamando o AuthService.
   * Se sucesso, o serviço redireciona. Se falha, exibe erro.
   */
  public onLogin(): void {
    this.loginErrorMessage = '';

    if (!this.username || !this.password) {
      this.loginErrorMessage = 'Insira usuário e senha.';
      return;
    }
    
    this.authService.login(this.username, this.password)
      .subscribe(success => {
        if (!success) {
          this.loginErrorMessage = 'Usuário ou senha não encontrado.';
        }
      });
  }

  /**
   * Captura o evento de Enter no input de senha para submeter o formulário.
   */
  public onLoginEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public focusPassword(event: Event): void {
    event.preventDefault();
    if (this.passwordField) {
      this.passwordField.nativeElement.focus();
    }
  }

  // --- SEÇÃO 8: LÓGICA DE RECUPERAÇÃO DE SENHA ---

  openForgotPassword(event: Event): void {
    event.preventDefault(); 
    this.showForgotPassword = true;
    this.forgotPasswordStep = 1; 
  }

  closeForgotPassword(): void {
    this.showForgotPassword = false;
    this.forgotUsername = '';
    this.foundPassword = '';
    this.foundUsernameDisplay = '';
    this.showPasswordMessage = '';
    this.newPassword = '';
    this.showNewPassword = false;
  }

  /**
   * Chamado pelo botão "REDEFINIR SENHA" (Passo 1).
   * Realiza validação e chama o serviço de reset.
   */
  onResetPassword(): void {
    if (!this.forgotUsername || !this.newPassword) {
      this.showPasswordMessage = 'Por favor, preencha o usuário e a nova senha.';
      return;
    }

    this.showPasswordMessage = '';

    this.authService.resetPassword(this.forgotUsername, this.newPassword)
      .subscribe({
        next: (response) => {
          this.forgotPasswordStep = 2; 
        },
        error: (err) => {
          if (err.error && err.error.error) {
            this.showPasswordMessage = err.error.error;
          } else {
            this.showPasswordMessage = 'Ocorreu um erro desconhecido.';
          }
        }
      });
  }

  onConclude(): void {
    this.closeForgotPassword();
  }

  public onFindPasswordEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }

  public toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  // --- SEÇÃO 9: LÓGICA DE CADASTRO (SIGN UP) ---

  openSignUp(event: Event): void {
    event.preventDefault(); 
    this.showSignUp = true;
    this.signUpStep = 1; 
  }

  closeSignUp(): void {
    this.showSignUp = false;
    this.signUpUsername = '';
    this.signUpPassword = '';
    this.signUpMessage = '';
    this.showSignUpPassword = false;    
  }

  /**
   * Executa o cadastro de um novo usuário.
   * Valida tamanho da senha e chama o serviço de registro.
   */
  onSignUp(): void {
    if (!this.signUpUsername || !this.signUpPassword) {
      this.signUpMessage = 'Por favor, preencha o usuário e a senha.';
      return;
    }
    if (this.signUpPassword.length < 6) {
       this.signUpMessage = 'A senha deve ter pelo menos 6 caracteres.';
       return;
    }

    this.signUpMessage = '';

    this.authService.register(this.signUpUsername, this.signUpPassword)
      .subscribe({
        next: (response) => {
          this.signUpStep = 2; 
        },
        error: (err) => {
          if (err.error && err.error.error) {
            this.signUpMessage = err.error.error;
          } else {
            this.signUpMessage = 'Ocorreu um erro desconhecido.';
          }
        }
      });
  }

  onSignUpConclude(): void {
    this.closeSignUp();
  }

  public focusSignUpPassword(event: Event): void {
    event.preventDefault();
    if (this.signUpPasswordField) {
      this.signUpPasswordField.nativeElement.focus();
    }
  }

  public onSignUpEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }

  public toggleSignUpPasswordVisibility(): void {
    this.showSignUpPassword = !this.showSignUpPassword;
  }
}