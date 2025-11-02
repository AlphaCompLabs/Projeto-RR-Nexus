/*
# =====================================================================================
# Projeto RR-Nexus
# Versão: 1.2.0
# Autor(es): Elisa / FrontEnd
# Data: 02/11/2025
# Descrição: Definição de estilo global para o frontend.

# Alteração: Adicionando cores branco e preto.
# =====================================================================================
*/


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    fontFamily: {
      'sans': ['Inter', 'sans-serif'], // 'Inter' é o novo padrão
      'baseet': ['Baseet', 'sans-serif'],
    },
    extend: {
      colors: {
        'nexus-black': '#000000',
        'nexus-darkest': '#130220',
        'nexus-dark': '#220A35',
        'nexus-purple-deep': '#5B0772',
        'nexus-purple': '#8C0590',
        'nexus-magenta': '#EA1EF3',
        'nexus-lavender': '#B17BC5',
        'nexus-pink-light': '#EBA4E6',
        'nexus-pink-pale': '#FCE8ED',
        'nexus-cream': '#FFFEE3',
        'nexus-white': '#FFFFFF',
      },
      backgroundImage: {
        'header-gradient': "linear-gradient(to bottom, #130220, #130220, #220A35, #220A35, #220A35, #130220)",
      }
    },
  },
  plugins: [],
}