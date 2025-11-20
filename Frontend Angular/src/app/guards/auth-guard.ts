import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    // O Guard chama o método que criamos
    return this.authService.checkAuth().pipe(
      tap((isAuthenticated) => {
        if (!isAuthenticated) {
          console.log('AuthGuard: Acesso negado. Redirecionando...');
          this.router.navigate(['/']);
        }
      })
    );
  }
}

