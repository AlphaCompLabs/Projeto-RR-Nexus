import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Esta é a nossa Guarda de Rota!
 * Ela vai proteger a página de perfil.
 */
export const authGuard: CanActivateFn = (route, state) => {
  
  // 1. Injete os nossos serviços
  const authService = inject(AuthService);
  const router = inject(Router);

  // 2. Verifique o estado de login (usando o "getter" que criámos)
  if (authService.isLoggedIn) {
    return true; // Está logado. Pode aceder à página.
  }

  // 3. NÃO está logado.
  console.log('AuthGuard: Acesso bloqueado! A redirecionar para o login.');
  router.navigate(['/']); // Redireciona para a página de login
  return false; // Bloqueia a navegação para '/meu-perfil'
};