/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.9.1
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o AuthGuard.
 * Verifica se a rota é protegida corretamente esperando a validação do backend.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth-guard'; // Importando a CLASSE correta
import { AuthService } from '../services/auth.service';
import { of, Observable } from 'rxjs';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(() => {
    // Criamos Mocks para as dependências
    const authSpy = jasmine.createSpyObj('AuthService', ['checkAuth']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: rSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('deve ser criado', () => {
    expect(guard).toBeTruthy();
  });

  // --- SEÇÃO 4: TESTES DE PERMISSÃO ---

  /**
   * Cenário: Token válido e Backend responde OK.
   * O Guard deve retornar TRUE e permitir a navegação.
   */
  it('deve PERMITIR acesso se checkAuth retornar true', (done) => {
    // Simula o backend respondendo "Sim, está logado"
    authServiceSpy.checkAuth.and.returnValue(of(true));

    // Como o canActivate retorna um Observable, precisamos fazer subscribe
    (guard.canActivate() as Observable<boolean>).subscribe(podeEntrar => {
      expect(podeEntrar).toBeTrue();
      done(); // Avisa o Jasmine que o teste assíncrono acabou
    });
  });

  // --- SEÇÃO 5: TESTES DE BLOQUEIO ---

  /**
   * Cenário: Sem token ou Backend responde Erro/Expirado.
   * O Guard deve retornar FALSE e redirecionar para home.
   */
  it('deve BLOQUEAR acesso e redirecionar se checkAuth retornar false', (done) => {
    // Simula o backend respondendo "Não, token inválido"
    authServiceSpy.checkAuth.and.returnValue(of(false));

    (guard.canActivate() as Observable<boolean>).subscribe(podeEntrar => {
      expect(podeEntrar).toBeFalse();
      
      // Verifica se chutou o usuário para a tela de login
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
      done();
    });
  });
});