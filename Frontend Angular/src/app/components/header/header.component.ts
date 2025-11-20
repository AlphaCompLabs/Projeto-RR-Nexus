/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.7.1
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente de cabeçalho que gerencia navegação inicial e estado visual
 * de login/perfil.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnDestroy } from '@angular/core';
import { ViewportScroller, CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; 
import { Subscription } from 'rxjs'; 
import { AuthService } from '../../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {

  // --- SEÇÃO 3: PROPRIEDADES ---
  public isLoggedIn: boolean = false;
  private authSubscription: Subscription;

  // --- SEÇÃO 4: INICIALIZAÇÃO E DEPENDÊNCIAS ---
  constructor(
    private scroller: ViewportScroller,
    private authService: AuthService,
    private router: Router 
  ) {
    // Escuta o estado de login para alternar o botão entre "LOGIN" e "PERFIL"
    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      status => {
        this.isLoggedIn = status;
      }
    );
  }

  // --- SEÇÃO 5: MÉTODOS DE AÇÃO ---

  /**
   * Chamado pelo botão "LOGIN" (quando usuário NÃO está logado).
   * Realiza a rolagem suave da página até a seção do formulário de login.
   */
  public scrollToLogin(): void {
    this.scroller.scrollToAnchor('login-form-section');
  }

  /**
   * Chamado pelo botão "PERFIL" (quando usuário JÁ está logado).
   * Navega o usuário para a rota interna de perfil (/meu-perfil).
   */
  public navigateToProfile(): void {
    this.router.navigate(['/meu-perfil']);
  }

  // --- SEÇÃO 6: CICLO DE VIDA (DESTRUCTION) ---

  /**
   * Limpa a subscrição do AuthService para evitar memory leaks.
   */
  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}