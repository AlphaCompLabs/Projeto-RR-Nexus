import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../services/auth.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Mock do AuthService
    // Precisamos apenas simular o método 'logout'
    const spy = jasmine.createSpyObj('AuthService', ['logout']);
    spy.logout.and.returnValue(of({})); // Retorna um Observable vazio (sucesso)

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

  it('deve renderizar o logo e o título "PERFIL"', () => {
    // Verifica se o logo existe
    const logo = fixture.debugElement.query(By.css('img[alt="Logo RR-Nexus"]'));
    expect(logo).toBeTruthy();

    // Verifica se o texto "PERFIL" está na tela
    const profileText = fixture.debugElement.query(By.css('h2')).nativeElement.textContent;
    expect(profileText).toContain('PERFIL');
  });

  it('deve chamar o método logout() do serviço ao clicar no botão "Sair"', () => {
    // Encontra o botão de sair (procura pelo texto ou classe)
    // Como temos dois spans dentro do botão, podemos procurar pelo botão em si
    const logoutButton = fixture.debugElement.query(By.css('button'));
    
    // Simula o clique
    logoutButton.triggerEventHandler('click', null);

    // Verifica se a função do componente foi chamada (opcional)
    // Mas o mais importante: verifica se o SERVIÇO foi chamado
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});