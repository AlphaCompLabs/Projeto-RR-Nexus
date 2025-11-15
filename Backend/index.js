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
const app = require('./app.js'); // <--- IMPORTA O APP CONFIGURADO

// Carrega variáveis de ambiente do .env para process.env
require('dotenv').config();

// Módulos de logging
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- SEÇÃO 0.1: CRASH PREVENTION ---
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
if (!MONGO_URI) {
    logger.error("Erro Fatal: A MONGO_CONNECTION_STRING não foi definida no arquivo .env.");
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info("MongoDB conectado com sucesso!");
    } catch (err) {
        logger.error("Falha ao conectar ao MongoDB:", err.message);
        process.exit(1);
    }
};

// --- SEÇÃO 6: INICIALIZAÇÃO DO SERVIDOR ---
const startServer = async () => {
    await connectDB(); // 1. Conecta ao Banco de Dados

    // 2. Inicia o listener do app (importado do app.js)
    app.listen(PORT, () => {
        logger.info(`Servidor Backend rodando na porta ${PORT}`);
        logger.info(`Acesse em http://localhost:${PORT}`);
    });
};

// Inicia a aplicação
startServer();