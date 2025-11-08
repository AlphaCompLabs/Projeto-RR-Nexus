import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
// [MUDANÇA 1] Importe 'HttpResponse' (ainda precisamos dele para o hostname)
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // O IP/domínio do seu Backend
  private readonly API_URL = 'http://172.19.50.25/api/auth'; 
  // O domínio do seu Frontend (que passa pelo DNS e Nginx)
  private readonly HOST_URL = 'http://www.meutrabalho.com.br'; 
  
  private readonly SESSION_KEY = 'rr-nexus-session-id';

  // --- NOSSOS "ESTADOS" GLOBAIS ---
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  
  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }
  
  public currentUser = new BehaviorSubject<any | null>(null);
  public currentSession = new BehaviorSubject<any | null>(null);
  
  // O 'Estado' para o hostname (continua igual)
  private currentHostname = new BehaviorSubject<string>('Carregando...');

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  // --- LÓGICA DE VALIDAÇÃO ---

  public validateSessionOnLoad(): void {
    const token = this.getToken();
    if (!token) {
      return; 
    }
    console.log('AuthService: Token encontrado no localStorage. Validando...');
    this.validateToken(token).subscribe();
  }

  /**
   * Função central que faz o GET /session/validate
   * [REVERTIDA] para ser simples e APENAS pegar o JSON.
   */
  private validateToken(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // [MUDANÇA 2] REMOVA "{ observe: 'response' }"
    // Esta chamada é para o Backend, que não tem o header do hostname.
    return this.http.get<any>(`${this.API_URL}/session/validate`, { headers: headers })
      .pipe(
        // [MUDANÇA 3] A resposta é 'any' (o JSON), não 'HttpResponse'
        tap((responseBody: any) => {
          // SUCESSO!
          
          // [MUDANÇA 4] REMOVA A LÓGICA DE LER HEADER DAQUI
          // (O hostname será buscado pela função 'getServerHostname' separadamente)

          // O resto da lógica usa 'responseBody'
          this.currentUser.next({ 
            username: responseBody.username, 
            userId: responseBody.userId 
          });
          this.currentSession.next({ 
            sessionId: responseBody.sessionId, 
            loginTime: responseBody.loginTime 
          });
          this.isLoggedInSubject.next(true);
        }),
        catchError(error => {
          // A lógica de erro não muda
          console.warn('AuthService: Validação falhou. Limpando sessão.', error.error.error);
          this.clearSession(); 
          this.router.navigate(['/']);
          return of(null);
        })
      );
  }

  // --- FUNÇÕES DE AJUDA (Helpers) ---

  public getToken(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  public saveSession(sessionId: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionId);
  }

  public clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.isLoggedInSubject.next(false);
    this.currentUser.next(null); 
    this.currentSession.next(null); 
    this.currentHostname.next('Carregando...'); // Limpa o hostname
    console.log('AuthService: Sessão limpa do localStorage e dos estados.');
  }

  // --- FUNÇÕES PRINCIPAIS (Login não muda) ---

  public login(username: string, password: string): Observable<boolean> {
    // (Esta função já está correta, não precisa mudar)
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/login`, body)
      .pipe(
        tap(response => {
          this.saveSession(response.sessionId);
          this.validateToken(response.sessionId).subscribe(() => {
            this.router.navigate(['/meu-perfil']);
          });
        }),
        map(() => true), 
        catchError(error => {
          console.error('AuthService: Falha no login real.', error.error);
          return of(false); 
        })
      );
  }

  // ... (logout, register, resetPassword não mudam) ...
  public logout(): Observable<any> {
    const sessionId = this.getToken();
    
    if (sessionId) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${sessionId}`
      });

      return this.http.post<any>(`${this.API_URL}/logout`, {}, { headers: headers })
        .pipe(
          tap(response => {
            console.log('AuthService: Sessão invalidada no backend.');
          }),
          catchError(error => {
            console.warn('AuthService: Erro ao invalidar sessão no backend.');
            return of(null);
          }),
          finalize(() => {
            this.clearSession();
            this.router.navigate(['/']); 
          })
        );
    } else {
      this.clearSession();
      this.router.navigate(['/']); 
      return of(null);
    }
  }

  public register(username: string, password: string): Observable<any> {
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/register`, body)
      .pipe(
        tap(response => {
          console.log('AuthService: Registo bem-sucedido!');
        }),
        catchError(error => {
          console.error('AuthService: Falha no registo.', error.error);
          throw error; 
        })
      );
  }

  public resetPassword(username: string, newPassword: string): Observable<any> {
    const body = { username: username, newPassword: newPassword };

    return this.http.post<any>(`${this.API_URL}/reset-password`, body)
      .pipe(
        tap(response => {
          console.log('AuthService: Senha redefinida com sucesso!', response.message);
        }),
        catchError(error => {
          console.error('AuthService: Falha no reset da senha.', error.error);
          throw error; 
        })
      );
  }


  /**
   * Pega o hostname do Servidor HTTP (A, B, ou C)
   * [CORRIGIDO] Faz uma chamada HTTP real para o Frontend Nginx.
   */
  public getServerHostname(): Observable<string> {
    
    // [MUDANÇA 5] Esta é agora uma chamada HTTP real para a rota 'lb-ping' 
    // do Nginx do Frontend (que passa pelo DNS).
    return this.http.get<any>(`${this.HOST_URL}/lb-ping`, { observe: 'response' })
      .pipe(
        map((response: HttpResponse<any>) => {
          // Lê o header 'X-Server-Name' que o Nginx do Frontend injetou
          const nginxHostname = response.headers.get('X-Server-Name');
          if (nginxHostname) {
            this.currentHostname.next(nginxHostname); // Salva no 'Estado'
            return nginxHostname;
          }
          return 'Nome não encontrado';
        }),
        catchError(error => {
          console.error('AuthService: Falha ao buscar hostname do HTTP server.', error);
          this.currentHostname.next('Erro de conexão');
          return of('Servidor Desconhecido'); // Fallback
        })
      );
  }
}