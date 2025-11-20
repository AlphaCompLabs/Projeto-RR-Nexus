/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.2.9
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o AuthService.
 * Cobre fluxos de Login, Logout, Validação, Register, Reset e Hostname.
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
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value + '');
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);

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
      expect(localStorage.setItem).toHaveBeenCalledWith('rr-nexus-session-id', 'sess-123');
    });

    const reqLogin = httpMock.expectOne('http://172.19.50.25/api/auth/login');
    expect(reqLogin.request.method).toBe('POST');
    reqLogin.flush({ sessionId: 'sess-123' });

    const reqValidate = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    reqValidate.flush({ 
      sessionId: 'sess-123', 
      username: 'aluno', 
      userId: '1' 
    });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/meu-perfil']);
  });

  it('LOGIN: deve retornar false se a API falhar', () => {
    service.login('aluno', 'errada').subscribe(success => {
      expect(success).toBeFalse();
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/login');
    req.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  // --- SEÇÃO 5: TESTES DE VALIDAÇÃO ---

  it('VALIDATE: não deve fazer nada se não houver token no localStorage', () => {
    store = {}; 
    service.validateSessionOnLoad();
    httpMock.expectNone('http://172.19.50.25/api/auth/session/validate');
  });

  it('VALIDATE: deve validar e atualizar estado se token existir', () => {
    store['rr-nexus-session-id'] = 'token-existente';
    
    service.validateSessionOnLoad();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-existente');
    
    req.flush({ username: 'teste', userId: '99', sessionId: 'token-existente' });

    expect(service.isLoggedIn).toBeTrue();
  });

  // --- SEÇÃO 6: TESTES DE LOGOUT ---

  it('LOGOUT: deve chamar API e limpar sessão (Caminho Feliz)', () => {
    store['rr-nexus-session-id'] = 'sessao-ativa';

    service.logout().subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('LOGOUT: deve limpar sessão local mesmo se API falhar (finalize)', () => {
    store['rr-nexus-session-id'] = 'sessao-ativa';

    service.logout().subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/logout');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  // --- SEÇÃO 7: TESTES DE HOSTNAME (LB-PING) ---

  it('HOSTNAME: deve extrair header X-Server-Name', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Server-C');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    req.flush({}, { headers: { 'X-Server-Name': 'Server-C' } });
  });

  it('HOSTNAME: deve tratar erro de conexão (catchError)', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Servidor Desconhecido');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    req.flush(null, { status: 504, statusText: 'Gateway Timeout' });
  });

  // --- SEÇÃO 8: TESTES DE CADASTRO E RESET ---

  it('REGISTER: deve lançar erro se falhar', () => {
    service.register('user', 'pass').subscribe({
      error: (err) => expect(err).toBeTruthy()
    });
    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    req.flush({ error: 'User exists' }, { status: 400, statusText: 'Bad Request' });
  });

  it('REGISTER: deve realizar o cadastro com sucesso (hit no tap)', () => {
    service.register('novoUser', '123456').subscribe();
    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    req.flush({ message: 'Cadastrado' }); 
  });

  it('RESET PASSWORD: deve redefinir senha com sucesso', () => {
    service.resetPassword('user', 'newPass').subscribe();
    const req = httpMock.expectOne('http://172.19.50.25/api/auth/reset-password');
    req.flush({ message: 'Senha alterada' });
  });
});