import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileFormComponent } from './profile-form.component';
import { AuthService } from '../../services/auth.service';
import { BehaviorSubject, Subject } from 'rxjs'; // Adicionado Subject
import { DatePipe } from '@angular/common';

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<any>;
  let currentSessionSubject: BehaviorSubject<any>;
  // 1. Criamos um Subject para o hostname para controlar o tempo de resposta
  let serverHostnameSubject: Subject<string>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<any>(null);
    currentSessionSubject = new BehaviorSubject<any>(null);
    serverHostnameSubject = new Subject<string>(); // Inicializa vazio

    const authSpy = jasmine.createSpyObj('AuthService', ['getServerHostname'], {
      currentUser: currentUserSubject.asObservable(),
      currentSession: currentSessionSubject.asObservable()
    });
    
    // 2. Retornamos o Observable do Subject, que não emite nada até mandarmos
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

  it('deve iniciar com valores de "Carregando..."', () => {
    // Dispara o ngOnInit. Como serverHostnameSubject ainda não emitiu nada,
    // a variável serverName continua com o valor padrão '...'
    fixture.detectChanges();
    
    expect(component.username).toBe('Carregando...');
    expect(component.serverName).toBe('...');
  });

  it('deve preencher os dados do usuário quando disponíveis', () => {
    fixture.detectChanges();
    currentUserSubject.next({ username: 'aluno', userId: '123' });
    fixture.detectChanges(); // Atualiza a tela

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
    
    // Verificamos se foi chamado
    expect(authServiceSpy.getServerHostname).toHaveBeenCalled();
    
    // Agora simulamos a resposta do servidor chegando
    serverHostnameSubject.next('Servidor-A');
    fixture.detectChanges(); // Atualiza a view

    expect(component.serverName).toBe('Servidor-A');
  });
});