/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.4
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Testes unitários para a ProfilePage.
 * Verifica a correta integração e renderização dos componentes filhos (Sidebar e Form).
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileFormComponent } from '../../components/profile-form/profile-form.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';

// --- SEÇÃO 2: SUÍTE DE TESTES ---
describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  // --- SEÇÃO 3: CONFIGURAÇÃO (SETUP) ---
  beforeEach(async () => {
    // Mock básico do AuthService necessário para os componentes filhos
    const authSpy = jasmine.createSpyObj('AuthService', ['logout', 'getServerHostname'], {
      currentUser: of(null),
      currentSession: of(null)
    });
    authSpy.getServerHostname.and.returnValue(of('Servidor-Test'));

   await TestBed.configureTestingModule({
      imports: [
        ProfilePage, 
        SidebarComponent, 
        ProfileFormComponent
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        DatePipe,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- SEÇÃO 4: TESTES DE ESTRUTURA ---

  it('deve ser criada', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifica se a Sidebar foi renderizada na página.
   */
  it('deve conter a Sidebar', () => {
    const sidebar = fixture.debugElement.nativeElement.querySelector('app-sidebar');
    expect(sidebar).toBeTruthy();
  });

  /**
   * Verifica se o Formulário de Perfil foi renderizado.
   */
  it('deve conter o Formulário de Perfil', () => {
    const profileForm = fixture.debugElement.nativeElement.querySelector('app-profile-form');
    expect(profileForm).toBeTruthy();
  });
});