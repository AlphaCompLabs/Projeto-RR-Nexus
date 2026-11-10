/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 1.0.0
 * Autor(es): Gustavo Martins Gripaldi (demo estática)
 * Data: 2026-11-10
 * Descrição: Entrada do pré-render, usada só no build "demo" (GitHub Pages). A página
 * inicial vira HTML estático (conteúdo e créditos visíveis antes do JavaScript); a área
 * logada (/meu-perfil/) e URLs desconhecidas continuam só no navegador.
 * O app não usa hidratação: ao carregar, o Angular renderiza por cima do HTML estático.
 * =====================================================================================
 */
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, RenderMode, withRoutes } from '@angular/ssr';
import { App } from './app/app';
import { appConfig } from './app/app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes([
      { path: '', renderMode: RenderMode.Prerender },
      { path: '**', renderMode: RenderMode.Client },
    ])),
  ],
};

export default (context: BootstrapContext) => bootstrapApplication(App, mergeApplicationConfig(appConfig, serverConfig), context);
