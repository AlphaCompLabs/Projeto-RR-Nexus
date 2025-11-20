/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.3.8
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o ProfileFormComponent.
 * Verifica se os dados do usuário e servidor são preenchidos corretamente na UI.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileFormComponent } from './profile-form.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs'; 
import { DatePipe } from '@angular/common';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;
  
  // Mocks e Subjects para simular o fluxo de dados
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<any>;
  let currentSessionSubject: BehaviorSubject<any>;
  let serverHostnameSubject: Subject<string>;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    // Inicializa os Subjects
    currentUserSubject = new BehaviorSubject<any>(null);
    currentSessionSubject = new BehaviorSubject<any>(null);
    serverHostnameSubject = new Subject<string>(); 

    // Cria o Spy do AuthService
    const authSpy = jasmine.createSpyObj('AuthService', ['getServerHostname'], {
      currentUser: currentUserSubject.asObservable(),
      currentSession: currentSessionSubject.asObservable()
    });
    
    // Retorna o Observable do Subject para controlar quando o hostname chega
    authSpy.getServerHostname.and.returnValue(serverHostnameSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [ProfileFormComponent, DatePipe],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
  });

  it('deve ser criado', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // --- SEÇÃO 4: TESTES DE ESTADO INICIAL ---

  it('deve iniciar com valores de "Carregando..."', () => {
    fixture.detectChanges();
    
    // Como o serverHostnameSubject ainda não emitiu, deve estar no valor padrão
    expect(component.username).toBe('Carregando...');
    expect(component.serverName).toBe('...');
  });

  // --- SEÇÃO 5: TESTES DE PREENCHIMENTO DE DADOS ---

  it('deve preencher os dados do usuário quando disponíveis', () => {
    fixture.detectChanges();
    
    // Emite novos dados no Subject
    currentUserSubject.next({ username: 'aluno', userId: '123' });
    fixture.detectChanges(); 

    expect(component.username).toBe('aluno');
    expect(component.userId).toBe('ID: 123');
  });

  it('deve preencher os dados da sessão quando disponíveis', () => {
    fixture.detectChanges();
    const now = new Date();
    
    currentSessionSubject.next({ sessionId: 'sess-abc', loginTime: now });
    fixture.detectChanges();

    expect(component.sessionId).toBe('sess-abc');
    expect(component.loginTime).toBe(now);
  });

  it('deve buscar e exibir o hostname do servidor', () => {
    fixture.detectChanges();
    
    expect(authServiceSpy.getServerHostname).toHaveBeenCalled();
    
    // Simula a resposta do servidor chegando
    serverHostnameSubject.next('Servidor-A');
    fixture.detectChanges(); 

    expect(component.serverName).toBe('Servidor-A');
  });
});