/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.4.5
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Página de Login.
 * Gerencia a exibição condicional entre o formulário de login e a mensagem de
 * "já autenticado", dependendo do estado global do usuário.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterLink } from '@angular/router'; 
import { Observable } from 'rxjs';

import { MiddleComponent } from '../../components/middle/middle.component';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { AuthService } from '../../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    MiddleComponent, 
    LoginFormComponent
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  
  // --- SEÇÃO 3: PROPRIEDADES ---
  /** Observable que reflete se o usuário está logado ou não */
  public isLoggedIn$: Observable<boolean>;

  // --- SEÇÃO 4: INICIALIZAÇÃO ---
  constructor(private authService: AuthService) {
    // Conecta a propriedade local ao estado global do serviço
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }
}