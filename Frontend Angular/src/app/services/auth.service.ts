import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = 'http://www.meutrabalho.com.br/api/auth';
  private readonly SESSION_KEY = 'rr-nexus-session-id';

  // --- NOSSOS "ESTADOS" GLOBAIS ---
  
  // 1. O estado de login (True/False)
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // --- GARANTA QUE ESTA FUNÇÃO "GETTER" EXISTE ---
  /**
   * Retorna o valor booleano atual de isLoggedIn
   */
  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }
  
  // 2. Os dados do UTILIZADOR (ex: 'aluno')
  public currentUser = new BehaviorSubject<any | null>(null);
  
  // 3. Os dados da SESSÃO (ex: ID, hora)
  public currentSession = new BehaviorSubject<any | null>(null);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  // --- LÓGICA DE VALIDAÇÃO (O Passo 6) ---

  /**
   * Chamado pelo AppComponent assim que a app carrega.
   * Verifica o localStorage e valida com o backend.
   */
  public validateSessionOnLoad(): void {
    const token = this.getToken();

    if (!token) {
      // Se não há token, não há nada a fazer.
      return; 
    }

    console.log('AuthService: Token encontrado no localStorage. Validando...');
    
    // Se há token, chame a nossa função de validação
    this.validateToken(token).subscribe();
  }

  /**
   * Função central que faz o GET /session/validate
   * Esta é chamada no F5 (pelo validateSessionOnLoad)
   * E também DEPOIS de um login bem-sucedido.
   */
  private validateToken(token: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.API_URL}/session/validate`, { headers: headers })
      .pipe(
        tap(response => {
          // SUCESSO! O token é válido.
          console.log('AuthService: Validação bem-sucedida.', response);
          
          // 1. Guarde os dados do utilizador
          this.currentUser.next({ 
            username: response.username, 
            userId: response.userId 
          });;
          // 2. Guarde os dados da sessão
          this.currentSession.next({ 
            sessionId: response.sessionId, 
            loginTime: response.loginTime 
          });
          // 3. Confirme que estamos logados
          this.isLoggedInSubject.next(true);
        }),
        catchError(error => {
          // FALHA! (Token expirado ou inválido)
          console.warn('AuthService: Validação falhou. Limpando sessão.', error.error.error);
          this.clearSession(); // Limpa o token mau
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
    // (A definição do isLoggedInSubject agora é feita pelo validateToken)
  }

  public clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    this.isLoggedInSubject.next(false);
    this.currentUser.next(null); // Limpa os dados do utilizador
    this.currentSession.next(null); // Limpa os dados da sessão
    console.log('AuthService: Sessão limpa do localStorage e dos estados.');
  }

  // --- FUNÇÕES PRINCIPAIS (Atualizadas) ---

  public login(username: string, password: string): Observable<boolean> {
    const body = { username: username, password: password };
    return this.http.post<any>(`${this.API_URL}/login`, body)
      .pipe(
        tap(response => {
          // SUCESSO NO LOGIN!
          // 1. Guarde o novo token (sessionId)
          this.saveSession(response.sessionId);
          
          // 2. CHAME A VALIDAÇÃO!
          // Isto é crucial: agora que temos um token,
          // chame o /validate para buscar TODOS os dados (incluindo a loginTime)
          // O .subscribe() aqui "dispara" a chamada.
          this.validateToken(response.sessionId).subscribe(() => {
            // 3. Navegue para o perfil SÓ DEPOIS de validar
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
    
    // (O clearSession() agora é chamado no 'finalize')
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
            // 3. Limpe tudo e navegue
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

  /**
   * Tenta redefinir a senha de um usuário.
   * Faz um POST real para o backend.
   */
  public resetPassword(username: string, newPassword: string): Observable<any> {
    
    // O corpo da requisição que o seu backend espera
    const body = { username: username, newPassword: newPassword };

    // 1. FAÇA A CHAMADA HTTP POST REAL
    // (Assumindo que o seu amigo mapeou 'resetPassword' para esta rota)
    return this.http.post<any>(`${this.API_URL}/reset-password`, body)
      .pipe(
        // 2. Se o registo for um SUCESSO
        tap(response => {
          console.log('AuthService: Senha redefinida com sucesso!', response.message);
        }),
        
        // 3. Se o registo FALHAR (ex: 404 Usuário não encontrado)
        catchError(error => {
          console.error('AuthService: Falha no reset da senha.', error.error);
          throw error; // Passa o erro para o componente
        })
      );
  }
}