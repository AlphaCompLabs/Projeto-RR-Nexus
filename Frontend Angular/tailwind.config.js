/*
# =====================================================================================
# Projeto RR-Nexus
# Versão: 1.0.0
# Autor(es): Elisa / FrontEnd
# Data: 02/11/2025
# Descrição: Definição de estilo global para o frontend.

# Alteração: Inserção da fonte e paleta de cores.
# =====================================================================================
*/

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", 
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'baseet': ['29LT Baseet', 'sans-serif'],
      },
      colors: {
        'nexus-darkest': '#130220',
        'nexus-dark': '#220A35',
        'nexus-purple-deep': '#5B0772',
        'nexus-purple': '#8C0590',
        'nexus-magenta': '#EA1EF3',
        'nexus-lavender': '#B17BC5',
        'nexus-pink-light': '#EBA4E6',
        'nexus-pink-pale': '#FCE8ED',
        'nexus-cream': '#FFFEE3',
      },
    },
  },
  plugins: [],
}