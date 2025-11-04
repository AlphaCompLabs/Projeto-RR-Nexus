// ARQUIVO: src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';

// 1. IMPORTE O 'provideHttpClient'
import { provideHttpClient } from '@angular/common/http';

import { 
  provideRouter, 
  withInMemoryScrolling 
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    
    // 2. ADICIONE O 'provideHttpClient()' AQUI
    // (Isto "liga" o HttpClient em toda a sua aplicação)
    provideHttpClient(), 

    // O seu provider de rotas (que já cá estava)
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top'
      })
    )
  ]
};