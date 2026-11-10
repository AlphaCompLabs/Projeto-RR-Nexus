/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 1.0.0
 * Autor(es): Gustavo Martins Gripaldi (demo estática)
 * Data: 2026-11-10
 * Descrição: Liga a API de demonstração (demo-api.ts) ao HttpClient. No build "demo"
 * (angular.json define DEMO_API) o interceptor responde às chamadas que o AuthService faz
 * ao backend (/api/auth/*) e ao Nginx (/lb-ping); nos outros builds nada muda.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { defer, delay, map } from 'rxjs';
import { handle, Store } from './demo-api';

// --- SEÇÃO 2: CONFIGURAÇÃO ---
declare const DEMO_API: boolean;
/** true só no build da demo estática (GitHub Pages). */
export const DEMO = typeof DEMO_API !== 'undefined' && DEMO_API;
export const PORTFOLIO_URL = 'https://g2portfolio.grovicdata.com/projetos/rr-nexus/';
export const DEMO_NOTE = 'Demo estática para portfólio: dados simulados no navegador.';

const KEY = 'rr-nexus-demo-db';
const store: Store = { load: () => localStorage.getItem(KEY), save: (v) => localStorage.setItem(KEY, v) };
/** Atraso de rede simulado, para o estado "PROCESSANDO..." aparecer como no ambiente real. */
const LATENCY_MS = 300;

// --- SEÇÃO 3: INTERCEPTOR ---
export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const path = new URL(req.url, location.href).pathname;
  if (!path.startsWith('/api/auth/') && path !== '/lb-ping') return next(req);
  return defer(() => handle(req.method, path, req.headers.get('Authorization'), req.body, store)).pipe(
    delay(LATENCY_MS),
    map(({ status, body, headers }) => {
      if (status >= 400) throw new HttpErrorResponse({ status, error: body, url: req.url, statusText: 'Demo' });
      return new HttpResponse({ status, body, headers: new HttpHeaders(headers), url: req.url });
    }),
  );
};
