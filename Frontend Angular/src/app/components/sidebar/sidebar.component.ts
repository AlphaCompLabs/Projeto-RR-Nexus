import { Component } from '@angular/core';
// 1. Importe o Router
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [], 
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  // 2. Injete o Router no construtor
  constructor(private router: Router) {}

  /**
   * Chamado pelo botão "Sair".
   * (No futuro, isto também limpará a sessão do utilizador)
   * Navega de volta para a página de login.
   */
  public logout(): void {
    console.log('Utilizador a sair...');
    // 3. Navega de volta para a página principal (login)
    this.router.navigate(['/']);
  }
}