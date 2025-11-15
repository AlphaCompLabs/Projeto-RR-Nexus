/* =====================================================================================
 * APP (Configuração do Express)
 * Versão: 1.3.0
 *
 * Descrição: Este arquivo define e configura a aplicação Express,
 * incluindo middlewares, rotas e tratamento de erros.
 * Ele NÃO inicia o servidor. (Separado para testes)
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---
const express = require('express');
const cors = require('cors');

// Módulos de logging
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- SEÇÃO 1: INICIALIZAÇÃO E CONFIGURAÇÃO DA APLICAÇÃO ---
const app = express();

// --- SEÇÃO 2: MIDDLEWARES ESSENCIAIS ---
app.use(express.json());

// --- Lista de Origens Permitidas (Whitelist) ---
const allowedOrigins = [
    'http://172.19.50.21', // HTTP-1
    'http://172.19.50.22', // HTTP-2
    'http://172.19.50.23', // HTTP-3
    'http://www.meutrabalho.com.br',
    'http://localhost:4200' 
];

const corsOptions = {
    origin: function (origin, callback) {
        // 1. Permite requisições sem 'origin' (ex: Postman/Insomnia)
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
app.use(cors(corsOptions));
logger.info("Middlewares essenciais (JSON, CORS) configurados com whitelist.");

// --- SEÇÃO 5: DEFINIÇÃO DE ROTAS (ENDPOINTS DA API) ---

// --- 5.1 Importação das Rotas ---
const authRoutes = require('./routes/auth.js');

// --- 5.2 Rotas Públicas (Health Check) ---
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'API do Backend (Sessão Centralizada) está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// --- 5.3 Rotas da Aplicação (Middleware de Roteamento) ---
app.use('/api/auth', authRoutes);

/*
 * ===============================================
 * FIM DAS DEFINIÇÕES DE ROTAS
 * ===============================================
 */

// --- SEÇÃO 5.5: MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS ---
app.use((err, req, res, next) => {
    // Loga o erro
    logger.error("Um erro não tratado foi pego pelo handler global:", err.message);
    console.error(err.stack); // Mostra a pilha de erro para debug
    
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: "Erro interno do servidor."
    });
});

// --- EXPORTAÇÃO (Para index.js e testes) ---
module.exports = app;