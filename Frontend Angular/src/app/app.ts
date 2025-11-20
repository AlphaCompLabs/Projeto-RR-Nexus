/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.9.9
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente Raiz (Root) da aplicação.
 * Responsável pela estrutura base, controle de carregamento inicial (Splash)
 * e visibilidade de elementos globais (Header/Footer).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component'; 
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from './services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  
  // --- SEÇÃO 3: PROPRIEDADES ---
  
  /** Título da aplicação (Sinal reativo) */
  protected readonly title = signal('projeto-rr-nexus');
  
  /** Controla a visibilidade do Header e Footer baseado na rota */
  public showHeaderFooter: boolean = true;
  
  /** Controla a tela de carregamento inicial (Splash Screen) */
  public isLoading: boolean = true;

  // --- SEÇÃO 4: INICIALIZAÇÃO ---
  constructor(
    private router: Router, 
    private authService: AuthService
  ) {
    // Monitora eventos de rota para esconder UI na página de perfil
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/meu-perfil') {
        this.showHeaderFooter = false;
      } else {
        this.showHeaderFooter = true; 
      }
    });

    // Conecta ao estado de carregamento global do AuthService
    this.authService.appLoading$.subscribe(loading => {
      this.isLoading = loading;
    });
  }

  /**
   * Hook de inicialização.
   * Dispara a validação de sessão ao carregar a aplicação.
   */
  ngOnInit(): void {
    this.authService.validateSessionOnLoad();
  }
}