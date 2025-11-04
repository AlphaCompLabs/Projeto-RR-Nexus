import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { ProfilePage } from './pages/profile/profile.page';
// 1. IMPORTE A GUARDA
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage
  },
  {
    path: 'meu-perfil',
    component: ProfilePage,
    canActivate: [authGuard]
  }
];