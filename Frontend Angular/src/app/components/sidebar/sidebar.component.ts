/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.8.0
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente de barra lateral (menu) para usuários autenticados.
 * Contém links úteis, informações de teste e a função de Logout.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  // --- SEÇÃO 3: INICIALIZAÇÃO ---
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  // --- SEÇÃO 4: MÉTODOS DE AÇÃO ---

  /**
   * Chamado pelo botão "Sair".
   * Aciona o serviço de autenticação para invalidar a sessão.
   * O redirecionamento para a home é tratado pelo próprio serviço (finalize).
   */
  public logout(): void {
    this.authService.logout().subscribe();
  }
}