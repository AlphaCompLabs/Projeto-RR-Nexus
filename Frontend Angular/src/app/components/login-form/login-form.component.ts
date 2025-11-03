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
  public showSignUp: boolean = false;
  public signUpStep: number = 1;
  public signUpUsername: string = '';
  public signUpPassword: string = '';
  public signUpMessage: string = '';

  @ViewChild('passwordInput') passwordField!: ElementRef;
  @ViewChild('signUpPasswordInput') signUpPasswordField!: ElementRef;

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

  /**
   * Abre o pop-up de CADASTRO (chamado pelo link 'Cadastre-se aqui')
   */
  openSignUp(event: Event): void {
    event.preventDefault(); // Impede o link <a> de recarregar a página
    this.showSignUp = true;
    this.signUpStep = 1; // Garante que comece no passo 1
  }

  /**
   * Fecha o pop-up de CADASTRO
   */
  closeSignUp(): void {
    this.showSignUp = false;
    // Limpa os campos para a próxima vez
    this.signUpUsername = '';
    this.signUpPassword = '';
    this.signUpMessage = '';
  }

  /**
   * Chamado pelo botão "CADASTRAR" (Passo 1).
   * No futuro, fará o POST para a API.
   */
  onSignUp(): void {
    
    // --- 1. Validação de campos vazios (como você pediu) ---
    if (!this.signUpUsername || !this.signUpPassword) {
      this.signUpMessage = 'Por favor, preencha o usuário e a senha.';
      return;
    }
    
    // --- 2. Validação extra (como você sugeriu) ---
    if (this.signUpPassword.length < 6) {
       this.signUpMessage = 'A senha deve ter pelo menos 6 caracteres.';
       return;
    }

    // --- 3. SIMULAÇÃO DE BACKEND (POST) ---
    console.log('Enviando POST de cadastro para o backend...');
    
    // Simulação: Vamos fingir que "aluno" e "iesb" já existem
    const usernameLower = this.signUpUsername.toLowerCase();
    
    if (usernameLower === 'aluno' || usernameLower === 'iesb') {
      
      // 3a. CASO DE ERRO (Usuário já existe)
      this.signUpMessage = 'Este nome de usuário já está em uso.';
      
    } else {
      
      // 3b. CASO DE SUCESSO
      console.log('Usuário cadastrado:', this.signUpUsername);
      this.signUpMessage = ''; // Limpa qualquer erro
      
      // Avança para o passo 2
      this.signUpStep = 2; 
    }
    // --- Fim da Simulação ---
  }

  /**
   * Chamado pelo botão "CONCLUÍDO" (Passo 2)
   */
  onSignUpConclude(): void {
    this.closeSignUp();
  }

  /**
   * Chamado pelo "Enter" no campo de usuário do cadastro.
   * Move o foco para o campo de senha do cadastro.
   */
  public focusSignUpPassword(event: Event): void {
    event.preventDefault();
    if (this.signUpPasswordField) {
      this.signUpPasswordField.nativeElement.focus();
    }
  }

  /**
   * Chamado pelo "Enter" no campo de senha do cadastro.
   * Simula um clique no botão "CADASTRAR".
   */
  public onSignUpEnter(event: Event, button: HTMLButtonElement): void {
    event.preventDefault();
    button.click();
  }
}