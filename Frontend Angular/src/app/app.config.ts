// ARQUIVO: src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';

// 1. Importe a função 'withInMemoryScrolling'
import { 
  provideRouter, 
  withInMemoryScrolling 
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    
    // 2. Adicione a feature 'withInMemoryScrolling'
    provideRouter(
      routes,
      
      // 3. Passe as opções de scroll para DENTRO dela
      withInMemoryScrolling({
        // Habilita o scroll para #id (ancoras)
        anchorScrolling: 'enabled',
        
        // Habilita o scroll para o topo ao recarregar/navegar
        scrollPositionRestoration: 'top'
      })
    )
  ]
};