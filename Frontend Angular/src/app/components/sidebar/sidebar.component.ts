import { Component } from '@angular/core';
import { Router } from '@angular/router';
// 1. IMPORTE O NOSSO NOVO SERVIÇO
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  // 2. INJETE O AuthService (e o Router)
  constructor(
    private router: Router,
    private authService: AuthService // <-- ADICIONADO
  ) {}

  /**
   * Chamado pelo botão "Sair".
   */
  public logout(): void {
    // 3. USE O SERVIÇO!
    this.authService.logout();
    // (O serviço de auth agora trata da navegação)
  }
}