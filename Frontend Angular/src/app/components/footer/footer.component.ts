/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.4.2
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Componente visual de rodapé (Footer) da aplicação.
 *
 * Alteração: Padronização de estrutura e comentários.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component } from '@angular/core';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
/**
 * FooterComponent
 * * Responsável por renderizar a área inferior da aplicação, contendo:
 * - Links para o GitHub do projeto e da organização.
 * - Informações de copyright e ano.
 * * Este é um componente Standalone e não possui lógica complexa interna.
 */
@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  // Nenhuma lógica interna necessária para este componente visual.
}