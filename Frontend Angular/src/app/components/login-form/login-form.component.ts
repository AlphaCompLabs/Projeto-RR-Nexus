import { Component } from '@angular/core';
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
}