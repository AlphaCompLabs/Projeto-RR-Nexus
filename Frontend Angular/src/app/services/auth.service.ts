import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
// [MUDANÇA 1] Importe 'HttpResponse' para lermos os headers
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // [MUDANÇA 2] Atualize suas URLs para o ambiente de produção
  // (O IP/domínio do seu Backend)
  private readonly API_URL = 'http://172.19.50.25/api/auth'; 
  // (O domínio do seu Frontend, que passa pelo DNS)
  private readonly HOST_URL = 'http://www.meutrabalho.com.br'; 
  
  private readonly SESSION_KEY = 'rr-nexus-session-id';

  // --- NOSSOS "ESTADOS" GLOBAIS ---
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }
  
  public currentUser = new BehaviorSubject<any | null>(null);
  public currentSession = new BehaviorSubject<any | null>(null);

  // [MUDANÇA 3] Crie um novo 'Estado' para o hostname
  // O 'validateToken' vai preencher isso, e o 'getServerHostname' vai ler.
  private currentHostname = new BehaviorSubject<string>('Carregando...');

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

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
   * [ATUALIZADA] para ler o header X-Server-Name
   */
  private validateToken(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // [MUDANÇA 4] Adicione "{ observe: 'response' }"
    // Isso nos dá a resposta completa (com headers), não só o JSON.
    return this.http.get<any>(`${this.API_URL}/session/validate`, { headers: headers, observe: 'response' })
      .pipe(
        // [MUDANÇA 5] O tipo da resposta agora é 'HttpResponse<any>'
        tap((response: HttpResponse<any>) => {
          // SUCESSO!
          
          // [MUDANÇA 6] LEIA O HEADER DO NGINX!
          const nginxHostname = response.headers.get('X-Server-Name');
          if (nginxHostname) {
            // E salve-o em nosso 'Estado'
            this.currentHostname.next(nginxHostname);
          }

          // [MUDANÇA 7] O JSON agora está em 'response.body'
          const responseBody = response.body;
          
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
    this.currentHostname.next('Carregando...'); // [MUDANÇA 8] Limpa o hostname
    console.log('AuthService: Sessão limpa do localStorage e dos estados.');
  }

  // --- FUNÇÕES PRINCIPAIS (Atualizadas) ---

  public login(username: string, password: string): Observable<boolean> {
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/login`, body)
      .pipe(
        tap(response => {
          // SUCESSO NO LOGIN!
          this.saveSession(response.sessionId);
          
          // O fluxo de 'validateToken' agora também buscará o hostname
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
            // Limpa tudo e navegue
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
   * [ATUALIZADO] Não faz mais uma chamada HTTP.
   * Apenas retorna o 'Estado' (Subject) que o 'validateToken' já preencheu.
   */
  public getServerHostname(): Observable<string> {
    // [MUDANÇA 9] Substitui a chamada HTTP por um retorno do 'Estado'
    return this.currentHostname.asObservable();
  }
}