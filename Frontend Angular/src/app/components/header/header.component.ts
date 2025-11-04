import { Component, OnDestroy } from '@angular/core';
import { ViewportScroller, CommonModule } from '@angular/common'; 
import { Router } from '@angular/router'; // O Router já cá estava
import { Subscription } from 'rxjs'; 
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {

  public isLoggedIn: boolean = false;
  private authSubscription: Subscription;

  constructor(
    private scroller: ViewportScroller,
    private authService: AuthService,
    private router: Router // O Router é necessário para a navegação
  ) {
    // A sua "escuta" do estado de login (está perfeita)
    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      status => {
        this.isLoggedIn = status;
      }
    );
  }

  // Função para rolar para o login (quando deslogado)
  public scrollToLogin(): void {
    this.scroller.scrollToAnchor('login-form-section');
  }

  // --- MUDANÇA AQUI ---
  // A função logout() foi removida.
  
  // 1. ADICIONE A NOVA FUNÇÃO DE NAVEGAÇÃO
  /**
   * Chamado pelo botão "PERFIL" (quando logado)
   * Navega para a página de perfil.
   */
  public navigateToProfile(): void {
    this.router.navigate(['/meu-perfil']);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}