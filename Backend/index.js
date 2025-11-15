/* =====================================================================================
 * SERVIDOR BACKEND (Arquivo de Inicialização)
 * Versão: 1.3.0
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Este script importa a configuração do app (de app.js)
 * e é responsável por conectar ao banco de dados e
 * iniciar o servidor HTTP.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---
const mongoose = require('mongoose');
//  Importar o 'app' configurado (de app.js).
// Este é o núcleo da separação de responsabilidades (config vs. execução).
const app = require('./app.js'); 

// Carrega variáveis de ambiente do .env para process.env
require('dotenv').config();

// Módulos de logging
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- SEÇÃO 0.1: CRASH PREVENTION (FAIL-FAST) ---
//  Implementar "handlers" globais para exceções não
// tratadas (uncaught) e promessas rejeitadas (unhandled).
// Isso segue o princípio "Fail-Fast": é melhor "crashar" de forma
// controlada e deixar um orquestrador (como Docker/PM2) reiniciar
// a aplicação do que continuar rodando em um estado instável.
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    process.exit(1); 
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
// ---------------------------------------------------------

// --- SEÇÃO 1: VARIÁVEIS DE AMBIENTE ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_CONNECTION_STRING;

// --- SEÇÃO 3: CONEXÃO COM O BANCO DE DADOS (MONGODB) ---

//  Validar a existência de variáveis de ambiente
// críticas ANTES de tentar iniciar a aplicação.
if (!MONGO_URI) {
    logger.error("Erro Fatal: A MONGO_CONNECTION_STRING não foi definida no arquivo .env.");
    process.exit(1); // "Fail-Fast"
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info("MongoDB conectado com sucesso!");
    } catch (err) {
        logger.error("Falha ao conectar ao MongoDB:", err.message);
        process.exit(1); // "Fail-Fast": Se o DB não conectar, a app não deve rodar.
    }
};

// --- SEÇÃO 6: INICIALIZAÇÃO DO SERVIDOR ---

//  Criar uma função 'async' para a inicialização
// (startServer) garante que o servidor só suba (app.listen)
// DEPOIS que as conexões essenciais (como o DB) forem estabelecidas.
const startServer = async () => {
    // 1. Conecta ao Banco de Dados
    await connectDB(); 

    // 2. Inicia o listener do app (importado do app.js)
    app.listen(PORT, () => {
        logger.info(`Servidor Backend rodando na porta ${PORT}`);
        logger.info(`Acesse em http://localhost:${PORT}`);
    });
};

// Inicia a aplicação
startServer();