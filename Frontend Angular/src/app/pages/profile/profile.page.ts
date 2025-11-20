/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.4.9
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Página de Perfil (Container).
 * Responsável por estruturar o layout da área logada, integrando a Sidebar
 * e o Formulário de Perfil.
 * =====================================================================================
 */

// --- SEÇÃO 1: IMPORTAÇÕES ---
import { Component } from '@angular/core';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ProfileFormComponent } from '../../components/profile-form/profile-form.component';

// --- SEÇÃO 2: DEFINIÇÃO DO COMPONENTE ---
/**
 * ProfilePage
 * Página principal da área autenticada.
 * Funciona como um "shell" que organiza os componentes visuais (Menu + Conteúdo).
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidebarComponent, ProfileFormComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.css'
})
export class ProfilePage {
  // A lógica de dados está delegada aos componentes filhos (Sidebar e ProfileForm).
}