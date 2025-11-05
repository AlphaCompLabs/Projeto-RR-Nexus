import { Component, OnInit, OnDestroy } from '@angular/core'; // 1. Importe OnDestroy
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs'; // 2. Importe Subscription
import { AuthService } from '../../services/auth.service'; // 3. Importe o AuthService

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css'
})
// 4. Implemente OnInit e OnDestroy
export class ProfileFormComponent implements OnInit, OnDestroy {

  // 5. Remova os dados simulados!
  public username: string = 'Carregando...';
  public userId: string = 'Carregando...';
  public sessionId: string = 'Carregando...';
  public serverName: string = '...'; // (Ver Nota)
  public loginTime: Date | null = null; // (Começa como nulo)

  // 6. Guarde as nossas "escutas"
  private userSub!: Subscription;
  private sessionSub!: Subscription;

  // 7. Injete o AuthService
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // 8. "Escute" as mudanças nos dados do utilizador
    this.userSub = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.username = user.username;
        this.userId = `ID: ${user.userId}`;
      }
    });

    // 9. "Escute" as mudanças nos dados da sessão
    this.sessionSub = this.authService.currentSession.subscribe(session => {
      if (session) {
        this.sessionId = session.sessionId;
        this.loginTime = session.loginTime;
        
        // --- NOTA IMPORTANTE (Requisito do PDF) ---
        // O seu backend (authController.js) não nos está a enviar
        // o 'serverName'. Para cumprir os requisitos do trabalho,
        // a equipa de backend precisa de o adicionar à resposta do /validate.
        // Por agora, vamos simular esta parte:
        this.serverName = "Servidor (Simulado)";
      }
    });
  }

  // 10. Limpe as "escutas" para evitar memory leaks
  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.sessionSub) this.sessionSub.unsubscribe();
  }
}