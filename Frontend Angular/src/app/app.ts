import { Component, OnInit, signal } from '@angular/core'; // <-- CORREÇÃO AQUI
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component'; 
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('projeto-rr-nexus'); // <-- O ERRO VAI DESAPARECER
  public showHeaderFooter: boolean = true;

  constructor(private router: Router, private authService: AuthService) {
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

  ngOnInit(): void {
    this.authService.validateSessionOnLoad();
  }
}