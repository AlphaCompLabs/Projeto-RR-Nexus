/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.2.3
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para o SidebarComponent.
 * Verifica renderização visual e a chamada correta do serviço de Logout.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    // Mock do AuthService para o método logout
    const spy = jasmine.createSpyObj('AuthService', ['logout']);
    spy.logout.and.returnValue(of({})); 

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  // --- SEÇÃO 4: TESTES VISUAIS ---

  it('deve renderizar o logo e o título "PERFIL"', () => {
    // Verifica logo
    const logo = fixture.debugElement.query(By.css('img[alt="Logo RR-Nexus"]'));
    expect(logo).toBeTruthy();

    // Verifica texto
    const profileText = fixture.debugElement.query(By.css('h2')).nativeElement.textContent;
    expect(profileText).toContain('PERFIL');
  });

  // --- SEÇÃO 5: TESTES DE AÇÃO (LOGOUT) ---

  it('deve chamar o método logout() do serviço ao clicar no botão "Sair"', () => {
    const logoutButton = fixture.debugElement.query(By.css('button'));
    
    // Simula clique
    logoutButton.triggerEventHandler('click', null);

    // Verifica se o serviço foi acionado
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});