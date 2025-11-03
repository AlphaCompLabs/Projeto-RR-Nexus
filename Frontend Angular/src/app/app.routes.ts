import { Routes } from '@angular/router';
import { LoginPage } from './pages/login/login.page';
import { ProfilePage } from './pages/profile/profile.page';

export const routes: Routes = [
  {
    path: '',
    component: LoginPage
  },

  {
    path: 'meu-perfil',
    component: ProfilePage
  }

];