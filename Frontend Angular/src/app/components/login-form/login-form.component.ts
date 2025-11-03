import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  
  public username: string = '';
  public password: string = '';
  public showPassword: boolean = false;

  @ViewChild('passwordInput') passwordField!: ElementRef;

  constructor() { }

  public onLogin(): void {
    if (!this.username || !this.password) {
      alert('Por favor, preencha o usuário e a senha.');
      return;
    }
    
    console.log('Enviando para o backend...');
    console.log('Usuário:', this.username);
    console.log('Senha:', this.password);
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // --- Propriedades do Pop-up (já existem) ---
  public showForgotPassword: boolean = false;
  public forgotPasswordStep: number = 1;
  public forgotUsername: string = '';
  public foundPassword: string = '';
  public foundUsernameDisplay: string = '';
  public showPasswordMessage: string = '';

  // --- Funções do Pop-up (já existem) ---
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
    
    console.log('Procurando usuário:', this.forgotUsername);
    
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
    // Impede que o "Enter" envie o formulário
    event.preventDefault();
    
    // Move o foco para o campo da senha
    if (this.passwordField) {
      this.passwordField.nativeElement.focus();
    }
  }

  /**
   * Chamado pelo "Enter" no campo "Esqueci minha senha".
   * Simula um clique no botão "PRÓXIMO".
   */
  public onFindPasswordEnter(event: Event, button: HTMLButtonElement): void {
    // 1. Impede que o "Enter" envie o formulário (comportamento padrão)
    event.preventDefault();
    
    // 2. Clica programaticamente no botão "PRÓXIMO"
    button.click();
  }
}