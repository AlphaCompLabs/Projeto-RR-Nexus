// ARQUIVO: src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';

// 1. IMPORTE O 'provideHttpClient'
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import {
  provideRouter,
  UrlSerializer,
  withInMemoryScrolling
} from '@angular/router';
import { routes } from './app.routes';
import { DEMO, demoInterceptor } from './demo/demo';
import { TrailingSlashSerializer } from './shared/trailing-slash';

export const appConfig: ApplicationConfig = {
  providers: [

    // 2. ADICIONE O 'provideHttpClient()' AQUI
    // (Isto "liga" o HttpClient em toda a sua aplicação)
    // Na demo estática, o interceptor responde no lugar do backend (src/app/demo/).
    provideHttpClient(withInterceptors(DEMO ? [demoInterceptor] : [])),

    // O seu provider de rotas (que já cá estava)
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top'
      })
    ),

    // URLs com barra final (/meu-perfil/): o GitHub Pages responde 301 sem ela.
    { provide: UrlSerializer, useClass: TrailingSlashSerializer }
  ]
};
