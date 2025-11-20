/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.0
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Definição das rotas principais da aplicação e aplicação de Guards.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { ProfilePage } from './pages/profile/profile.page';
import { AuthGuard } from './guards/auth-guard';

// --- SEÇÃO 2: CONFIGURAÇÃO DE ROTAS ---
export const routes: Routes = [
  {
    path: '',
    component: LoginPage
  },
  {
    path: 'meu-perfil',
    component: ProfilePage,
    canActivate: [AuthGuard] // Protege a rota de perfil
  }
];