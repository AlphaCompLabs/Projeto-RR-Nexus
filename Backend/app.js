/* =====================================================================================
 * APP (Configuração do Express)
 * Versão: 1.3.0
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Este arquivo define e configura a aplicação Express,
 * incluindo middlewares, rotas e tratamento de erros.
 * Ele NÃO inicia o servidor. (Separado para testes)
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---
const express = require('express');
const cors = require('cors');

// Módulos de logging
//  Ter um logger (mesmo que simples) é crucial.
// Em produção, isso seria substituído por Winston ou Pino.
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- SEÇÃO 1: INICIALIZAÇÃO E CONFIGURAÇÃO DA APLICAÇÃO ---
//  'app' é a instância central do Express
// que será configurada e exportada.
const app = express();

// --- SEÇÃO 2: MIDDLEWARES ESSENCIAIS ---

//  Middleware para parsear o corpo (body) de
// requisições JSON. Essencial para POST/PUT.
app.use(express.json());

//  Uma 'whitelist' (lista de permissões) de
// origens é a forma correta e segura de configurar o CORS.
const allowedOrigins = [
    'http://172.19.50.21', // HTTP-1
    'http://172.19.50.22', // HTTP-2
    'http://172.19.50.23', // HTTP-3
    'http://www.meutrabalho.com.br',
    'http://localhost:4200' 
];

const corsOptions = {
    origin: function (origin, callback) {
        //  Permitir requisições sem 'origin' (ex: Postman)
        // E origens que estão na 'whitelist'.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true); // Permite a requisição
        } else {
            // Bloqueia origens não permitidas
            const msg = `CORS Error: A origem '${origin}' não tem permissão para acessar este recurso.`;
            logger.warn(msg);
            callback(new Error(msg), false); // BLOQUEIA A REQUISIÇÃO
        }
    }
};

//  Aplicar o middleware de CORS com as opções de segurança.
app.use(cors(corsOptions));
logger.info("Middlewares essenciais (JSON, CORS) configurados com whitelist.");

// --- SEÇÃO 5: DEFINIÇÃO DE ROTAS (ENDPOINTS DA API) ---

// --- 5.1 Importação das Rotas ---
//  As definições de rotas são modularizadas em
// seus próprios arquivos (ex: ./routes/auth.js).
const authRoutes = require('./routes/auth.js');

// --- 5.2 Rotas Públicas (Health Check) ---
//  Manter uma rota 'GET /' (health check) é uma
// excelente prática para "smoke tests" e load balancers.
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'API do Backend (Sessão Centralizada) está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// --- 5.3 Rotas da Aplicação (Middleware de Roteamento) ---
//  Montar os roteadores importados em um
// "base path" (ex: /api/auth).
app.use('/api/auth', authRoutes);

/*
 * ===============================================
 * FIM DAS DEFINIÇÕES DE ROTAS
 * ===============================================
 */

// --- SEÇÃO 5.5: MIDDLEWARE GLOBAL DE TRATAMENTO DE ERROS ---

//  Este é o "Global Error Handler".
// É o middleware MAIS IMPORTANTE para a robustez da API.
// Ele deve ser o ÚLTIMO 'app.use()' a ser definido.
//
// Para ser um error handler, ele DEVE ter 4 argumentos: (err, req, res, next).
app.use((err, req, res, next) => {
    
    // 1. Loga o erro internamente (para debug)
    logger.error("Um erro não tratado foi pego pelo handler global:", err.message);
    console.error(err.stack); // Mostra a pilha de erro para debug
    
    // 2. Define o status
    const statusCode = err.statusCode || 500; // 500 (Internal Server Error) como padrão

    // 3. Envia uma resposta genérica ao cliente
    //  NUNCA vaze detalhes do erro (como o err.stack)
    // para o cliente em produção.
    res.status(statusCode).json({
        error: "Erro interno do servidor."
    });
});

// --- EXPORTAÇÃO (Para index.js e testes) ---
//  Exportar 'app' (e não 'server') é o que
// permite que o supertest (api.test.js) importe e
// teste a aplicação sem realmente subir um servidor na rede.
module.exports = app;