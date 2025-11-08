/* =====================================================================================
 * SERVIDOR BACKEND - AUTENTICAÇÃO E SESSÃO CENTRALIZADA
 * Versão: 1.3.0 (Implementa validação de sessão e logout)
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Este script (index.js) implementa a API central para gerenciamento
 * de usuários e sessões. Esta versão introduz os endpoints
 * /session/validate e /logout, protegidos por token.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

// Módulos principais do Node e da aplicação
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Para hashing de senhas
const crypto = require('crypto');   // Para geração de tokens de sessão seguros
const cors = require('cors');       // Para Cross-Origin Resource Sharing

// Carrega variáveis de ambiente do .env para process.env
require('dotenv').config();



// Módulos de logging
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// ---  SEÇÃO 0: CRASH PREVENTION  ---
// Captura erros que não foram tratados em código 'async'
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    
    // process.exit(1); 
});

// Captura erros síncronos que não foram tratados
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Isso é um erro fatal. O app deve ser reiniciado.
    process.exit(1);
});
// ---------------------------------------------------------

// --- SEÇÃO 1: INICIALIZAÇÃO E CONFIGURAÇÃO DA APLICAÇÃO ---

const app = express();
const PORT = process.env.PORT || 3000; // Porta padrão 3000 se não definida no .env

// --- SEÇÃO 2: MIDDLEWARES ESSENCIAIS ---

// Middleware para parsing de JSON
app.use(express.json());

// --- Lista de Origens Permitidas (Whitelist) ---
// Define explicitamente quem pode falar com a nossa API.
const allowedOrigins = [
    'http://172.19.50.21', // HTTP-1
    'http://172.19.50.22', // HTTP-2
    'http://172.19.50.23', // HTTP-3
    'http://www.meutrabalho.com.br',
    'http://localhost:4200' 
];

const corsOptions = {
    origin: function (origin, callback) {
        // 'origin' é quem está tentando nos acessar (ex: 'http://172.19.50.21')

        // 1. Permite requisições sem 'origin' (ex: Postman/Insomnia ou apps mobile)
        if (!origin) {
            return callback(null, true);
        }

        // 2. Verifica se a origem está na nossa lista de permissões
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `CORS Error: A origem '${origin}' não tem permissão para acessar este recurso.`;
            logger.warn(msg);
            return callback(new Error(msg), false); // BLOQUEIA A REQUISIÇÃO
        }

        // 3. Se a origem ESTÁ na lista, permite
        return callback(null, true);
    }
};

// --- Middleware de CORS (Cross-Origin Resource Sharing) ---
// Substitui TODAS as chamadas 'app.use(cors())' anteriores por esta ÚNICA chamada.
app.use(cors(corsOptions));



// NOTA DE PRODUÇÃO: Para segurança máxima, restrinja as origens:
// app.use(cors({ origin: 'http://seu-frontend.com' }));

logger.info("Middlewares essenciais (JSON, CORS) configurados com whitelist.");
// --- SEÇÃO 3: CONEXÃO COM O BANCO DE DADOS (MONGODB) ---

const MONGO_URI = process.env.MONGO_CONNECTION_STRING;

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

// --- SEÇÃO 4: IMPORTAÇÃO DOS MODELS (SCHEMAS) ---

const Usuario = require('./models/Usuario.js');
const Sessao = require('./models/Sessao.js');

// --- SEÇÃO 5: DEFINIÇÃO DE ROTAS (ENDPOINTS DA API) ---

// --- 5.1 Importação das Rotas ---
// Importamos o arquivo de rotas de autenticação que acabamos de criar.
const authRoutes = require('./routes/auth.js');

// --- 5.2 Rotas Públicas (Health Check) ---

/**
 * Rota de "saúde" (health check).
 * (Esta rota é a única que fica no index.js, pois é global)
 */
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'API do Backend (Sessão Centralizada) está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// --- 5.3 Rotas da Aplicação (Middleware de Roteamento) ---


// "Qualquer requisição que comece com '/api/auth'deve ser gerenciada pelo nosso arquivo 'authRoutes'".
app.use('/api/auth', authRoutes);


/*
 * ===============================================
 * FIM DAS DEFINIÇÕES DE ROTAS
 * ===============================================
 */

// ---  SEÇÃO 5.5: MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS ---
// ESTE DEVE SER O ÚLTIMO 'app.use()'
// O Express reconhece um middleware de 4 argumentos como um Error Handler
app.use((err, req, res, next) => {
    // Loga o erro
    logger.error("Um erro não tratado foi pego pelo handler global:", err.message);
    console.error(err.stack); // Mostra a pilha de erro para debug
    
    // Define um status de erro padrão (500) se nenhum foi definido
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: "Erro interno do servidor.",
        // Apenas para desenvolvimento, podemos enviar a mensagem de erro
        // message: err.message 
    });
});


// --- SEÇÃO 6: INICIALIZAÇÃO DO SERVIDOR ---

/**
 * Função principal de inicialização.
 * 1. Conecta ao Banco de Dados.
 * 2. Inicia o listener do servidor Express na porta definida.
 */
const startServer = async () => {
    await connectDB(); // Garante que o banco está conectado ANTES de aceitar requisições

    app.listen(PORT, () => {
        logger.info(`Servidor Backend rodando na porta ${PORT}`);
        logger.info(`Acesse em http://localhost:${PORT}`);
    });
};

// Inicia a aplicação
startServer();