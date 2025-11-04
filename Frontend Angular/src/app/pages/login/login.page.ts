import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Precisamos disto para o AsyncPipe
import { RouterLink } from '@angular/router'; // Precisamos disto para o link [routerLink]
import { Observable } from 'rxjs';

// Os seus componentes e serviços
import { MiddleComponent } from '../../components/middle/middle.component';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  // 1. ADICIONE CommonModule e RouterLink aos imports
  imports: [
    CommonModule, 
    RouterLink,
    MiddleComponent, 
    LoginFormComponent
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  
  // 2. Crie uma variável para "observar" o estado de login
  public isLoggedIn$: Observable<boolean>;

  // 3. Injete o AuthService
  constructor(private authService: AuthService) {
    // 4. "Ligue" a variável local ao Observable do serviço
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }
}