/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 3.1.0
 * Autor(es): Elisa / FrontEnd
 * Data: 02/11/2025
 * Descrição: Configuração do Karma Test Runner.
 * Define frameworks, plugins e reporters para execução dos testes e cobertura.
 * =====================================================================================
 */

// --- SEÇÃO 1: EXPORTAÇÃO DA CONFIGURAÇÃO ---
module.exports = function (config) {
  config.set({
    basePath: '',
    
    // --- SEÇÃO 2: FRAMEWORKS ---
    frameworks: ['jasmine'], 
    
    // --- SEÇÃO 3: PLUGINS ---
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],

    // --- SEÇÃO 4: CONFIGURAÇÃO DO CLIENTE ---
    client: {
      jasmine: {
        // você pode adicionar configurações do jasmine aqui se precisar
      },
      clearContext: false // deixa o resultado visível no navegador
    },

    jasmineHtmlReporter: {
      suppressAll: true 
    },

    // --- SEÇÃO 5: CONFIGURAÇÃO DE COBERTURA (REPORTERS) ---
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/projeto-rr-nexus'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'json-summary' }
      ]
    },

    // --- SEÇÃO 6: CONFIGURAÇÕES DE EXECUÇÃO ---
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['Chrome'],
    singleRun: true,
    restartOnFileChange: true
  });
};