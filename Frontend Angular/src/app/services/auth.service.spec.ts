import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let store: { [key: string]: string } = {};

  beforeEach(() => {
    store = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => store[key] = value + '');
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => delete store[key]);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [], // Não precisamos mais importar o HttpClientTestingModule aqui
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

  // ==========================================================================
  // 1. TESTES DE LOGIN (SUCESSO E ERRO)
  // ==========================================================================

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

  // ==========================================================================
  // 2. TESTES DE VALIDAÇÃO DE SESSÃO (ON LOAD)
  // ==========================================================================

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

  it('VALIDATE: deve limpar sessão e navegar para home se validação falhar', () => {
    store['rr-nexus-session-id'] = 'token-expirado';
    
    service.validateSessionOnLoad();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/session/validate');
    req.flush({ error: 'Session expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.removeItem).toHaveBeenCalledWith('rr-nexus-session-id');
    expect(service.isLoggedIn).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  // ==========================================================================
  // 3. TESTES DE LOGOUT (COM E SEM TOKEN)
  // ==========================================================================

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

  it('LOGOUT: deve apenas limpar e navegar se não houver token (sem chamada HTTP)', () => {
    store = {}; 

    service.logout().subscribe();

    httpMock.expectNone('http://172.19.50.25/api/auth/logout');
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  // ==========================================================================
  // 4. TESTES DE HOSTNAME (LB-PING)
  // ==========================================================================

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
    req.flush({}); 
  });

  it('HOSTNAME: deve tratar erro de conexão (catchError)', () => {
    service.getServerHostname().subscribe(host => {
      expect(host).toBe('Servidor Desconhecido');
    });

    const req = httpMock.expectOne('http://www.meutrabalho.com.br/lb-ping');
    req.flush(null, { status: 504, statusText: 'Gateway Timeout' });
  });

  // ==========================================================================
  // 5. TESTES DE REGISTER E RESET PASSWORD (ERROS)
  // ==========================================================================

  it('REGISTER: deve lançar erro se falhar', () => {
    service.register('user', 'pass').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    req.flush({ error: 'User exists' }, { status: 400, statusText: 'Bad Request' });
  });

  it('RESET PASSWORD: deve lançar erro se falhar', () => {
    service.resetPassword('user', 'newPass').subscribe({
      error: (err) => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/reset-password');
    req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });

  // ==========================================================================
  // 6. O QUE FALTOU: CAMINHOS FELIZES DE REGISTER E RESET
  // ==========================================================================

  it('REGISTER: deve realizar o cadastro com sucesso (hit no tap)', () => {
    service.register('novoUser', '123456').subscribe(res => {
      // Opcional: verificar resposta
    });

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/register');
    expect(req.request.method).toBe('POST');
    // Ao retornar sucesso, o código entra no pipe tap() e executa o console.log
    req.flush({ message: 'Cadastrado' }); 
  });

  it('RESET PASSWORD: deve redefinir senha com sucesso (hit no tap)', () => {
    service.resetPassword('user', 'newPass').subscribe();

    const req = httpMock.expectOne('http://172.19.50.25/api/auth/reset-password');
    expect(req.request.method).toBe('POST');
    // Retornar sucesso ativa o tap() e a mensagem de sucesso
    req.flush({ message: 'Senha alterada' });
  });

});