/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.5.8
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Configuração do Tailwind CSS.
 * Define a paleta de cores personalizada (Nexus Theme), fontes e caminhos de conteúdo.
 *
 * Alteração: Adicionando cores branco e preto.
 * =====================================================================================
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  
  // --- SEÇÃO 1: CONTEÚDO ---
  content: [
    "./src/**/*.{html,ts}",
  ],

  // --- SEÇÃO 2: TEMA E EXTENSÕES ---
  theme: {
    fontFamily: {
      'sans': ['Inter', 'sans-serif'], // 'Inter' é o novo padrão
      'baseet': ['Baseet', 'sans-serif'],
    },
    extend: {
      // Paleta de cores personalizada do projeto
      colors: {
        'nexus-black': '#000000',
        'nexus-darkest': '#130220',
        'nexus-dark': '#220A35',
        'nexus-purple-deep': '#5B0772',
        'nexus-purple-dark': '#320746',
        'nexus-purple': '#8C0590',
        'nexus-purple-light': '#BE59BE',
        'nexus-magenta': '#EA1EF3',
        'nexus-lavender': '#B17BC5',
        'nexus-pink-light': '#EBA4E6',
        'nexus-pink-pale': '#FCE8ED',
        'nexus-cream': '#FFFEE3',
        'nexus-white': '#FFFFFF',
      },
      // Gradientes de fundo
      backgroundImage: {
        'header-gradient': "linear-gradient(to bottom, #130220, #130220, #220A35, #220A35, #220A35, #130220)",
        'login-gradient': "linear-gradient(to bottom, #130220, #220A35, #220A35, #220A35, #220A35)",
        'profile-gradient': "linear-gradient(to bottom, #220A35, #220A35, #220A35, #220A35, #130220, #130220)"
      }
    },
  },
  
  // --- SEÇÃO 3: PLUGINS ---
  plugins: [],
}