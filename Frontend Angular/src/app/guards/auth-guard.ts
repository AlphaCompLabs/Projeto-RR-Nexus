/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.6.8
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Guarda de rotas (CanActivate) que protege páginas restritas.
 * Verifica a autenticação diretamente no Backend antes de liberar o acesso,
 * prevenindo redirecionamentos indevidos ao recarregar a página (F5).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DA GUARDA ---
/**
 * AuthGuard
 * Intercepta a navegação para rotas protegidas (ex: /meu-perfil).
 * Solicita ao AuthService que verifique a validade do token/sessão.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  // --- SEÇÃO 3: INICIALIZAÇÃO ---
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  // --- SEÇÃO 4: LÓGICA DE PROTEÇÃO ---

  /**
   * Método obrigatório da interface CanActivate.
   * Retorna um Observable<boolean> que o Angular aguarda antes de renderizar a rota.
   * - true: Permite a navegação.
   * - false: Bloqueia e redireciona para o Login.
   */
  canActivate(): Observable<boolean> {
    // Chama o método que espera a resposta do backend (resolve o problema do F5)
    return this.authService.checkAuth().pipe(
      tap((isAuthenticated) => {
        if (!isAuthenticated) {
          console.log('AuthGuard: Acesso negado. Redirecionando...');
          this.router.navigate(['/']);
        }
      })
    );
  }
}