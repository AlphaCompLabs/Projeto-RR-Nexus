import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  // Helper para executar a guarda dentro do contexto de injeção do Angular
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Cria os Spies (Simulações)
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // Simula a propriedade 'isLoggedIn' do AuthService
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: false // Valor padrão inicial
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  it('deve ser criado', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('deve permitir o acesso (return true) se o usuário estiver logado', () => {
    // ARRANGE: Simula que o usuário ESTÁ logado
    // Acessamos o getter espião e forçamos o retorno true
    (Object.getOwnPropertyDescriptor(authServiceSpy, 'isLoggedIn')?.get as jasmine.Spy).and.returnValue(true);

    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // ACT: Executa a guarda
    const result = executeGuard(route, state);

    // ASSERT: Verifica se permitiu
    expect(result).toBeTrue();
    // Garante que NÃO redirecionou
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('deve bloquear o acesso (return false) e redirecionar para "/" se NÃO estiver logado', () => {
    // ARRANGE: Simula que o usuário NÃO ESTÁ logado
    (Object.getOwnPropertyDescriptor(authServiceSpy, 'isLoggedIn')?.get as jasmine.Spy).and.returnValue(false);

    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    // ACT: Executa a guarda
    const result = executeGuard(route, state);

    // ASSERT: Verifica se bloqueou
    expect(result).toBeFalse();
    // Verifica se chamou o roteador para ir para a página de login
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });
});