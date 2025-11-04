import { Component, signal } from '@angular/core';
// 1. IMPORTE Router, NavigationEnd, CommonModule
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common'; // Precisamos disto para o *ngIf
import { filter } from 'rxjs/operators';

import { HeaderComponent } from './components/header/header.component'; 
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('projeto-rr-nexus');
  
  public showHeaderFooter: boolean = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url === '/meu-perfil') {
        this.showHeaderFooter = false;
      } else {
        this.showHeaderFooter = true; 
      }
    });
  }
}