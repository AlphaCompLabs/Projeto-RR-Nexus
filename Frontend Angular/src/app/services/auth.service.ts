/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.9.5
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Serviço central de Autenticação e Sessão.
 * Gerencia tokens, comunicação com API de Auth e descoberta do servidor HTTP (Hostname).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';

// --- SEÇÃO 2: DEFINIÇÃO DO SERVIÇO ---
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // --- SEÇÃO 3: CONSTANTES E CONFIGURAÇÕES ---
  private readonly API_URL = 'http://172.19.50.25/api/auth'; 
  private readonly HOST_URL = 'http://www.meutrabalho.com.br'; 
  private readonly SESSION_KEY = 'rr-nexus-session-id';

  // --- SEÇÃO 4: ESTADOS GLOBAIS (Subjects) ---
  
  /** Controla se a aplicação está carregando a sessão inicial (Splash Screen) */
  public appLoading$ = new BehaviorSubject<boolean>(true);

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean>;
  
  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }
  
  public currentUser = new BehaviorSubject<any | null>(null);
  public currentSession = new BehaviorSubject<any | null>(null);
  private currentHostname = new BehaviorSubject<string>('Carregando...');

  // --- SEÇÃO 5: INICIALIZAÇÃO ---
  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  // --- SEÇÃO 6: VALIDAÇÃO DE SESSÃO (ON LOAD) ---

  /**
   * Chamado pelo AppComponent ao iniciar.
   * Verifica se existe token e valida. Libera o 'appLoading$' ao final.
   */
  public validateSessionOnLoad(): void {
    const token = this.getToken();
    
    if (!token) {
      this.appLoading$.next(false); 
      return; 
    }

    console.log('AuthService: Token encontrado. Verificando...');
    
    this.validateToken(token)
      .pipe(
        finalize(() => {
          // Garante que o loading pare, independente de sucesso ou erro
          this.appLoading$.next(false);
        })
      )
      .subscribe();
  }

  /**
   * Valida o token no backend e preenche os estados de usuário/sessão.
   */
  private validateToken(token: string): Observable<any> {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    return this.http.get<any>(`${this.API_URL}/session/validate`, { headers: headers })
      .pipe(
        tap((responseBody: any) => {
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
          console.warn('AuthService: Validação falhou.', error);
          this.clearSession(); 
          // Não redirecionamos aqui para evitar conflito com o Guard
          return of(null);
        })
      );
  }

  // --- SEÇÃO 7: GUARDA DE ROTAS (CHECK AUTH) ---

  /**
   * Método usado pelo AuthGuard para esperar a resposta do backend.
   * Retorna true/false e resolve o problema de F5 na rota protegida.
   */
  public checkAuth(): Observable<boolean> {
     const token = this.getToken();
     
     if (!token) return of(false);

     const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
     
     return this.http.get<any>(`${this.API_URL}/session/validate`, { headers: headers }).pipe(
        tap((res: any) => {
            // Atualiza estados se o Guard rodar antes do validateSessionOnLoad
            this.currentUser.next({ username: res.username, userId: res.userId });
            this.isLoggedInSubject.next(true);
        }),
        map(() => true),
        catchError(() => {
            this.clearSession();
            return of(false);
        })
     );
  }

  // --- SEÇÃO 8: AUTENTICAÇÃO (LOGIN/LOGOUT) ---

  public login(username: string, password: string): Observable<boolean> {
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/login`, body)
      .pipe(
        tap(response => {
          this.saveSession(response.sessionId);
          // Após login, validamos para pegar os dados completos
          this.validateToken(response.sessionId).subscribe(() => {
            this.router.navigate(['/meu-perfil']);
          });
        }),
        map(() => true), 
        catchError(error => {
          console.error('AuthService: Falha no login.', error.error);
          return of(false); 
        })
      );
  }

  public logout(): Observable<any> {
    const sessionId = this.getToken();
    
    if (sessionId) {
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${sessionId}` });

      return this.http.post<any>(`${this.API_URL}/logout`, {}, { headers: headers })
        .pipe(
          tap(() => console.log('AuthService: Sessão invalidada no backend.')),
          catchError(() => of(null)),
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

  // --- SEÇÃO 9: GERENCIAMENTO DE USUÁRIO ---

  public register(username: string, password: string): Observable<any> {
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/register`, body)
      .pipe(
        tap(() => console.log('AuthService: Registo bem-sucedido!')),
        catchError(error => { throw error; })
      );
  }

  public resetPassword(username: string, newPassword: string): Observable<any> {
    const body = { username: username, newPassword: newPassword };
    return this.http.post<any>(`${this.API_URL}/reset-password`, body)
      .pipe(
        tap(res => console.log('AuthService: Senha redefinida!', res.message)),
        catchError(error => { throw error; })
      );
  }

  // --- SEÇÃO 10: DESCOBERTA DE SERVIDOR (HOSTNAME) ---

  /**
   * Busca o hostname do servidor HTTP atual.
   * Faz uma requisição ao Frontend (Nginx) para ler o header X-Server-Name.
   */
  public getServerHostname(): Observable<string> {
    return this.http.get<any>(`${this.HOST_URL}/lb-ping`, { observe: 'response' })
      .pipe(
        map((response: HttpResponse<any>) => {
          const nginxHostname = response.headers.get('X-Server-Name');
          if (nginxHostname) {
            this.currentHostname.next(nginxHostname);
            return nginxHostname;
          }
          return 'Nome não encontrado';
        }),
        catchError(error => {
          console.error('AuthService: Erro ao buscar hostname.', error);
          return of('Servidor Desconhecido');
        })
      );
  }

  // --- SEÇÃO 11: HELPERS (STORAGE) ---

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
    this.currentHostname.next('Carregando...'); 
    console.log('AuthService: Sessão limpa.');
  }
}