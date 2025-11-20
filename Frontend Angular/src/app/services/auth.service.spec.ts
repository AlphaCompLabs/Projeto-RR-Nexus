/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.9.8
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o AuthService.
 * Cobre 100% dos fluxos: Login, Logout, Validação, Register, Reset, Hostname
 * e o controle de estado de carregamento (appLoading).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let store: { [key: string]: string } = {};

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(() => {
    store = {};
    
    // Mock do LocalStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value + '');
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);
    
    // Mock do Console (para evitar poluição e testar os logs dos catchErrors)
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  // --- SEÇÃO 4: TESTES DE LOGIN ---

  it('LOGIN: deve fazer login, salvar sessão e navegar', () => {
    service.login('aluno', '123').subscribe(success => {
      expect(success).toBeTrue();
      // Verifica se salvou no storage
      expect(localStorage.setItem).toHaveBeenCalledWith('rr-nexus-session-id', 'sess-123');
    });

    // 1. Requisição de Login
    const reqLogin = httpMock.expectOne('http://172.19.50.25/api/auth/login');
    expect(reqLogin.request.method).toBe('POST');
    reqLogin.flush({ sessionId: 'sess-123' });

    // 2. Requisição de Validação (automática após login)
    const reqValidate = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    reqValidate.flush({ 
      sessionId: 'sess-123', 
      username: 'aluno', 
      userId: '1' 
    });

    // Verifica navegação
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meu-perfil']);
  });

  it('LOGIN: deve retornar false se a API falhar', () => {
    service.login('aluno', 'errada').subscribe(success => {
      expect(success).toBeFalse();
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/login');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    
    // Verifica se o catchError logou o erro
    expect(console.error).toHaveBeenCalled();
  });

  // --- SEÇÃO 5: TESTES DE VALIDAÇÃO E LOADING ---

  it('VALIDATE: deve parar o loading imediatamente se não houver token', () => {
    store = {}; // Sem token
    
    // Verifica estado inicial
    expect(service.appLoading$.value).toBeTrue();

    service.validateSessionOnLoad();
    
    httpMock.expectNone('http://172.19.50.25/api/auth/session/validate');
    
    // Verifica se o loading parou
    expect(service.appLoading$.value).toBeFalse();
  });

  it('VALIDATE: deve validar, atualizar estado e parar loading (Sucesso)', () => {
    store['rr-nexus-session-id'] = 'token-existente';
    
    service.validateSessionOnLoad();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-existente');
    
    req.flush({ username: 'teste', userId: '99', sessionId: 'token-existente' });

    expect(service.isLoggedIn).toBeTrue();
    // Verifica se o loading parou após a resposta
    expect(service.appLoading$.value).toBeFalse();
  });

  it('VALIDATE: deve limpar sessão e parar loading se falhar', () => {
    store['rr-nexus-session-id'] = 'token-expirado';
    
    service.validateSessionOnLoad();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    req.flush({ error: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.removeItem).toHaveBeenCalledWith('rr-nexus-session-id');
    expect(service.isLoggedIn).toBeFalse();
    
    // Verifica o console.warn do catchError
    expect(console.warn).toHaveBeenCalled();
    
    // O finalize deve garantir que o loading parou mesmo com erro
    expect(service.appLoading$.value).toBeFalse();
  });

  // --- SEÇÃO 6: TESTES DO GUARD CHECK (CHECK AUTH) ---

  it('CHECK AUTH: deve retornar FALSE se não houver token', (done) => {
    store = {}; 
    service.checkAuth().subscribe(isAuth => {
      expect(isAuth).toBeFalse();
      done();
    });
  });

  it('CHECK AUTH: deve retornar TRUE se o backend validar', (done) => {
    store['rr-nexus-session-id'] = 'token-ok';

    service.checkAuth().subscribe(isAuth => {
      expect(isAuth).toBeTrue();
      expect(service.isLoggedIn).toBeTrue(); // Estado atualizado
      done();
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    req.flush({ username: 'user', userId: '1' });
  });

  it('CHECK AUTH: deve retornar FALSE e limpar sessão se backend rejeitar', (done) => {
    store['rr-nexus-session-id'] = 'token-ruim';

    service.checkAuth().subscribe(isAuth => {
      expect(isAuth).toBeFalse();
      expect(localStorage.removeItem).toHaveBeenCalled();
      done();
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });
  });

  // --- SEÇÃO 7: TESTES DE LOGOUT ---

  it('LOGOUT: deve chamar API e limpar sessão (Caminho Feliz)', () => {
    store['rr-nexus-session-id'] = 'sessao-ativa';

    service.logout().subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/logout');
    req.flush({});

    // Verifica se o tap do logout foi chamado
    expect(console.log).toHaveBeenCalledWith('AuthService: Sessão invalidada no backend.');
    
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('LOGOUT: deve limpar sessão local mesmo se API falhar', () => {
    store['rr-nexus-session-id'] = 'sessao-ativa';

    service.logout().subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/logout');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    // Verifica o catchError
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('LOGOUT: deve apenas limpar e navegar se não houver token', () => {
    store = {}; 

    service.logout().subscribe();

    httpMock.expectNone('http://172.19.50.25/api/auth/logout');
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  // --- SEÇÃO 8: TESTES DE HOSTNAME (LB-PING) ---

  it('HOSTNAME: deve extrair header X-Server-Name', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Server-C');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    req.flush({}, { headers: { 'X-Server-Name': 'Server-C' } });
  });

  it('HOSTNAME: deve retornar "Nome não encontrado" se header faltar', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Nome não encontrado');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    // Resposta sem headers específicos
    req.flush({}); 
  });

  it('HOSTNAME: deve tratar erro de conexão e retornar fallback', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Servidor Desconhecido');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    req.flush(null, { status: 504, statusText: 'Gateway Timeout' });
    
    expect(console.error).toHaveBeenCalledWith('AuthService: Erro ao buscar hostname.', jasmine.any(Object));
  });

  // --- SEÇÃO 9: TESTES DE CADASTRO E RESET ---

  it('REGISTER: deve realizar o cadastro com sucesso (hit no tap)', () => {
    service.register('novoUser', '123456').subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    req.flush({ message: 'Cadastrado' }); 
    
    expect(console.log).toHaveBeenCalledWith('AuthService: Registo bem-sucedido!');
  });

  it('REGISTER: deve lançar erro se falhar', () => {
    service.register('user', 'pass').subscribe({
      error: (err) => expect(err).toBeTruthy()
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    req.flush({ error: 'User exists' }, { status: 400, statusText: 'Bad Request' });
  });

  it('RESET PASSWORD: deve redefinir senha com sucesso (hit no tap)', () => {
    service.resetPassword('user', 'newPass').subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/reset-password');
    req.flush({ message: 'Senha alterada' });
    
    expect(console.log).toHaveBeenCalledWith('AuthService: Senha redefinida!', 'Senha alterada');
  });

  it('RESET PASSWORD: deve lançar erro se falhar', () => {
    service.resetPassword('user', 'newPass').subscribe({
      error: (err) => expect(err).toBeTruthy()
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/reset-password');
    req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });

  // --- SEÇÃO 10: TESTES DE GETTERS E HELPERS ---
  
  it('GETTER isLoggedIn: deve retornar o valor do subject', () => {
    // Por padrão começa false
    expect(service.isLoggedIn).toBeFalse();
    
    // Forçamos uma mudança no subject via login simulado
    service['isLoggedInSubject'].next(true);
    expect(service.isLoggedIn).toBeTrue();
  });
});