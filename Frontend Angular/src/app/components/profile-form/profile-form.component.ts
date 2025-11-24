/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.7.4
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente responsável por exibir os dados do perfil do usuário logado,
 * incluindo detalhes da sessão e do servidor conectado.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css'
})
export class ProfileFormComponent implements OnInit, OnDestroy {

  // --- SEÇÃO 3: PROPRIEDADES ---
  
  // Valores padrão (placeholders) para evitar "piscar" vazio
  public username: string = 'Carregando...';
  public userId: string = 'Carregando...';
  public sessionId: string = 'Carregando...';
  public serverName: string = 'Identificando Servidor...';
  public loginTime: Date | null = null;

  // Referências para as subscrições do RxJS
  private userSub!: Subscription;
  private sessionSub!: Subscription;
  private hostSub!: Subscription; 

  // --- SEÇÃO 4: INICIALIZAÇÃO ---
  constructor(private authService: AuthService) { }

  /**
   * Hook de inicialização.
   * Subscreve aos Observables do AuthService para manter os dados atualizados
   * em tempo real, caso a sessão mude.
   */
  ngOnInit(): void {
    // 1. Escuta dados do Utilizador
    this.userSub = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.username = user.username;
        this.userId = `ID: ${user.userId}`; 
      }
    });

    // 2. Escuta dados da Sessão
    this.sessionSub = this.authService.currentSession.subscribe(session => {
      if (session) {
        this.sessionId = session.sessionId;
        this.loginTime = session.loginTime;
      }
    });

    // 3. Escuta o Hostname (Servidor A/B/C)
    this.hostSub = this.authService.getServerHostname().subscribe(hostname => {
      if (hostname) {
        this.serverName = hostname;
      } else {
        // Fallback caso a resposta seja nula
        this.serverName = 'Servidor Desconhecido';
      }
    });
  }

  // --- SEÇÃO 5: DESTRUIÇÃO (CLEANUP) ---

  /**
   * Limpa todas as subscrições ao destruir o componente
   * para prevenir vazamento de memória.
   */
  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.sessionSub) this.sessionSub.unsubscribe();
    if (this.hostSub) this.hostSub.unsubscribe();
  }
}