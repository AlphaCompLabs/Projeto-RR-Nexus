import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Component } from '@angular/core';

// 1. IMPORTE OS COMPONENTES REAIS AQUI
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

// --- MOCKS ---
@Component({selector: 'app-header', standalone: true, template: ''})
class MockHeaderComponent {}

@Component({selector: 'app-footer', standalone: true, template: ''})
class MockFooterComponent {}

@Component({selector: 'dummy-cmp', standalone: true, template: ''})
class DummyComponent {}

describe('AppComponent', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['validateSessionOnLoad']);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([
          { path: 'meu-perfil', component: DummyComponent },
          { path: 'outra', component: DummyComponent }
        ])
      ]
    })
    .overrideComponent(App, {
      // 2. REMOVA OS COMPONENTES REAIS
      remove: { imports: [HeaderComponent, FooterComponent] },
      // 3. ADICIONE OS MOCKS
      add: { imports: [MockHeaderComponent, MockFooterComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    
    fixture.detectChanges();
  });

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it(`deve ter o título 'projeto-rr-nexus'`, () => {
    expect(component['title']()).toEqual('projeto-rr-nexus');
  });

  it('deve chamar validateSessionOnLoad no início (ngOnInit)', () => {
    expect(authServiceSpy.validateSessionOnLoad).toHaveBeenCalled();
  });

  it('deve ESCONDER header/footer na rota "/meu-perfil"', async () => {
    await router.navigate(['/meu-perfil']);
    fixture.detectChanges();
    expect(component.showHeaderFooter).toBeFalse();
  });

  it('deve MOSTRAR header/footer em outras rotas', async () => {
    await router.navigate(['/outra']);
    fixture.detectChanges();
    expect(component.showHeaderFooter).toBeTrue();
  });
});