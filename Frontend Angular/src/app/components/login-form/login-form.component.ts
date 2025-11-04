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
    
    // 4. USE O SERVIÇO!
    // A lógica foi movida para o authService.
    const loginSuccess = this.authService.login(this.username, this.password);

    if (!loginSuccess) {
      // Se o serviço retornou 'false', mostre o erro
      this.loginErrorMessage = 'Usuário ou senha não encontrado.';
    }
    // (Se o login for um sucesso, o próprio serviço já navega)
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
  }
  onFindPassword(): void {
    if (!this.forgotUsername) {
      this.showPasswordMessage = 'Por favor, digite o nome de usuário.';
      return;
    }
    const usernameLower = this.forgotUsername.toLowerCase();
    if (usernameLower === 'aluno' || usernameLower === 'iesb') {
      this.foundPassword = 'senha_123'; 
      this.foundUsernameDisplay = this.forgotUsername; 
      this.showPasswordMessage = ''; 
      this.forgotPasswordStep = 2;
    } else {
      this.showPasswordMessage = 'Usuário não encontrado.';
    }
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
  }
  onSignUp(): void {
    if (!this.signUpUsername || !this.signUpPassword) {
      this.signUpMessage = 'Por favor, preencha o usuário e a senha.';
      return;
    }
    if (this.signUpPassword.length < 6) {
       this.signUpMessage = 'A senha deve ter pelo menos 6 caracteres.';
       return;
    }
    const usernameLower = this.signUpUsername.toLowerCase();
    if (usernameLower === 'aluno' || usernameLower === 'iesb') {
      this.signUpMessage = 'Este nome de usuário já está em uso.';
    } else {
      this.signUpMessage = ''; 
      this.signUpStep = 2; 
    }
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
}