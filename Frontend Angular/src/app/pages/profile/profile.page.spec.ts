import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileFormComponent } from '../../components/profile-form/profile-form.component';
import { AuthService } from '../../services/auth.service';
import { of, BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';
import { DatePipe } from '@angular/common';

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;

  beforeEach(async () => {
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

  it('deve ser criada', () => {
    expect(component).toBeTruthy();
  });

  it('deve conter a Sidebar', () => {
    const sidebar = fixture.debugElement.nativeElement.querySelector('app-sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('deve conter o Formulário de Perfil', () => {
    const profileForm = fixture.debugElement.nativeElement.querySelector('app-profile-form');
    expect(profileForm).toBeTruthy();
  });
});