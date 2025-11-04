import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileFormComponent } from '../../components/profile-form/profile-form.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  // 2. ADICIONE-OS aos imports
  imports: [SidebarComponent, ProfileFormComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage {
  // (Aqui, futuramente, vamos carregar os dados do usuário)
}