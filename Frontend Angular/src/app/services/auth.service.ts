import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs'; // Importante para "observar" o estado
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 1. Usamos um BehaviorSubject para guardar o estado de login (true/false)
  // Ele começa como 'false' (deslogado).
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);

  // 2. Expomos o estado como um Observable (que os componentes podem "ver")
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  public get isLoggedIn(): boolean {
    return this.isLoggedInSubject.getValue();
  }

  constructor(private router: Router) { }

  /**
   * Tenta fazer o login.
   * No futuro, isto fará um POST para o backend.
   */
  public login(username: string, password: string): boolean {
    
    // --- SIMULAÇÃO DE BACKEND ---
    const u = username.toLowerCase();
    const p = password;

    if ((u === 'aluno' || u === 'iesb') && p === '123') {
      // SUCESSO!
      console.log('AuthService: Login bem-sucedido!');
      this.isLoggedInSubject.next(true); // Informa a todos os componentes que estamos logados
      this.router.navigate(['/meu-perfil']); // Navega para o perfil
      return true;
    } else {
      // FALHA
      console.log('AuthService: Falha no login.');
      return false; // Retorna 'false' para o formulário de login
    }
  }

  /**
   * Desloga o utilizador.
   */
  public logout(): void {
    console.log('AuthService: Logout...');
    this.isLoggedInSubject.next(false); // Informa a todos que estamos deslogados
    this.router.navigate(['/']); // Envia de volta para a página de login
  }
}