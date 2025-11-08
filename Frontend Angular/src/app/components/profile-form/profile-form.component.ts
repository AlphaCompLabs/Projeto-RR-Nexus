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
    // 1. "Escute" os dados do Utilizador (username, userId)
    // (Isto vem da validação da sessão que o AuthGuard já fez)
    this.userSub = this.authService.currentUser.subscribe(user => {
      if (user) {
        this.username = user.username;
        this.userId = `ID: ${user.userId}`; 
      }
    });

    // 2. "Escute" os dados da Sessão (sessionId, loginTime)
    this.sessionSub = this.authService.currentSession.subscribe(session => {
      if (session) {
        this.sessionId = session.sessionId;
        this.loginTime = session.loginTime;
      }
    });

    // 3. FAÇA A NOVA CHAMADA PARA O HOSTNAME
    // Pede ao servidor HTTP (A, B, ou C) o seu nome
    this.authService.getServerHostname().subscribe(hostname => {
      this.serverName = hostname; // Preenche o campo "Servidor:"
    });
  }

  // 10. Limpe as "escutas" para evitar memory leaks
  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.sessionSub) this.sessionSub.unsubscribe();
  }
}