module.exports = function (config) {
  config.set({
    basePath: '',
    // 1. FRAMEWORKS: Deixe apenas o jasmine
    frameworks: ['jasmine'], 
    
    // 2. PLUGINS: Removemos o plugin do angular-devkit que estava dando erro
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage')
    ],

    client: {
      jasmine: {
        // você pode adicionar configurações do jasmine aqui se precisar
      },
      clearContext: false // deixa o resultado visível no navegador
    },

    jasmineHtmlReporter: {
      suppressAll: true 
    },

    // Configuração do relatório (mantemos igual para gerar o TXT)
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/projeto-rr-nexus'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'json-summary' }
      ]
    },

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