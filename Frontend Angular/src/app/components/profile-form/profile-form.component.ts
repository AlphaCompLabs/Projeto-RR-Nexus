import { Component, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './profile-form.component.html',
  styleUrl: './profile-form.component.css'
})
export class ProfileFormComponent implements OnInit, OnDestroy {

  public username: string = 'Carregando...';
  public userId: string = 'Carregando...';
  public sessionId: string = 'Carregando...';
  public serverName: string = '...';
  public loginTime: Date | null = null;

  // Guarde as nossas "escutas"
  private userSub!: Subscription;
  private sessionSub!: Subscription;
  private hostSub!: Subscription; // Para o hostname

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // 1. "Escute" os dados do Utilizador (username, userId)
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

    // 3. "Escute" o Hostname (que o AuthService agora tem)
    this.hostSub = this.authService.getServerHostname().subscribe(hostname => {
      this.serverName = hostname; // Preenche o campo "Servidor:"
    });
  }

  // 10. Limpe as "escutas" para evitar memory leaks
  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
    if (this.sessionSub) this.sessionSub.unsubscribe();
    if (this.hostSub) this.hostSub.unsubscribe();
  }
}