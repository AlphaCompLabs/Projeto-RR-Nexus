import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Vamos precisar do CommonModule para o @if
import { FormsModule } from '@angular/forms'; 
// 1. IMPORTE O NOSSO NOVO SERVIÇO
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule], // Mantenha o CommonModule
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  
  public username: string = '';
  public password: string = '';
  public showPassword: boolean = false;
  public loginErrorMessage: string = ''; 
  
  @ViewChild('passwordInput') passwordField!: ElementRef;
  @ViewChild('signUpPasswordInput') signUpPasswordField!: ElementRef;

  // 2. INJETE O AuthService (e o Router)
  constructor(
    private router: Router,
    private authService: AuthService // <-- ADICIONADO
  ) { }

  // 3. ATUALIZE O 'onLogin()'
  public onLogin(): void {
    this.loginErrorMessage = '';

    if (!this.username || !this.password) {
      this.loginErrorMessage = 'Insira usuário e senha.';
      return;
    }
    
    // 4. USE O SERVIÇO (AGORA COM .subscribe())
    // A lógica de "loginSuccess" mudou para aqui dentro.
    this.authService.login(this.username, this.password)
      .subscribe(success => {
        // O subscribe vai esperar pela resposta do backend
        if (!success) {
          // Se o authService nos devolveu 'false', mostre o erro
          this.loginErrorMessage = 'Usuário ou senha não encontrado.';
        }
        // (Se 'success' for true, o próprio serviço já tratou da navegação)
      });
  }

  // ... (a sua função onLoginEnter() fica igual) ...
  public onLoginEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }

  // ... (todas as suas outras funções de pop-up e toggle ficam aqui) ...
  // ... (togglePasswordVisibility, openForgotPassword, etc.) ...
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  public showForgotPassword: boolean = false;
  public forgotPasswordStep: number = 1;
  public forgotUsername: string = '';
  public foundPassword: string = '';
  public foundUsernameDisplay: string = '';
  public showPasswordMessage: string = '';
  public showSignUp: boolean = false;
  public signUpStep: number = 1;
  public signUpUsername: string = '';
  public signUpPassword: string = '';
  public signUpMessage: string = '';
  public showSignUpPassword: boolean = false;
  public newPassword: string = '';
  public showNewPassword: boolean = false;

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
   * Faz o POST para a API.
   */
  onResetPassword(): void {
    
    // 1. Validação do frontend
    if (!this.forgotUsername || !this.newPassword) {
      this.showPasswordMessage = 'Por favor, preencha o usuário e a nova senha.';
      return;
    }
    // (Pode adicionar mais validações, como 'newPassword.length < 6')

    // 2. Limpa a mensagem de erro
    this.showPasswordMessage = '';

    // 3. USE O SERVIÇO (com .subscribe())
    this.authService.resetPassword(this.forgotUsername, this.newPassword)
      .subscribe({
        // 4. Callback de SUCESSO
        next: (response) => {
          // O backend deu sucesso, avance para o Passo 2
          this.forgotPasswordStep = 2; 
        },
        
        // 5. Callback de ERRO
        error: (err) => {
          // Mostra a mensagem de erro vinda do backend
          // (Ex: "Usuário não encontrado.")
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
  public focusPassword(event: Event): void {
    event.preventDefault();
    if (this.passwordField) {
      this.passwordField.nativeElement.focus();
    }
  }
  public onFindPasswordEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }
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
  // --- ATUALIZAÇÃO DA FUNÇÃO onSignUp ---
  onSignUp(): void {
    // 1. Validação do frontend (como você já tinha)
    if (!this.signUpUsername || !this.signUpPassword) {
      this.signUpMessage = 'Por favor, preencha o usuário e a senha.';
      return;
    }
    if (this.signUpPassword.length < 6) {
       this.signUpMessage = 'A senha deve ter pelo menos 6 caracteres.';
       return;
    }

    // 2. Limpa a mensagem de erro antes de tentar
    this.signUpMessage = '';

    // 3. USE O SERVIÇO (com .subscribe())
    this.authService.register(this.signUpUsername, this.signUpPassword)
      .subscribe({
        // 4. Callback de SUCESSO
        next: (response) => {
          // O backend deu sucesso, avance para o Passo 2
          this.signUpStep = 2; 
        },
        
        // 5. Callback de ERRO
        error: (err) => {
          // Mostra a mensagem de erro vinda do backend
          // (Ex: "Este nome de usuário já está em uso.")
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

  public toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  public toggleSignUpPasswordVisibility(): void {
    this.showSignUpPassword = !this.showSignUpPassword;
  }
}