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
const swaggerJsdoc = require('swagger-jsdoc');     //  Lê comentários código
const swaggerUi = require('swagger-ui-express');   //  Pega o JSON e cria página de documentação interativa

// Carrega variáveis de ambiente do .env para process.env
require('dotenv').config();

// Módulos de logging
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- SEÇÃO 1: INICIALIZAÇÃO E CONFIGURAÇÃO DA APLICAÇÃO ---

const app = express();
const PORT = process.env.PORT || 3000; // Porta padrão 3000 se não definida no .env

// --- SEÇÃO 2: MIDDLEWARES ESSENCIAIS ---

// Middleware para parsing de JSON
app.use(express.json());

// Middleware de CORS (Cross-Origin Resource Sharing) 
// Habilita que outras origens (ex: seu frontend em http://localhost:4200)
// possam fazer requisições para esta API.
app.use(cors());
// NOTA DE PRODUÇÃO: Para segurança máxima, restrinja as origens:
// app.use(cors({ origin: 'http://seu-frontend.com' }));

logger.info("Middlewares essenciais (JSON, CORS) configurados.");

// --- SEÇÃO 2.1: CONFIGURAÇÃO DO SWAGGER (DOCUMENTAÇÃO DA API) ---

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Autenticação Centralizada',
            version: '1.3.0', // Versão do app
            description: 'API para gerenciamento de usuários e sessões (Backend)',
        },
        servers: [
            {
                url: `http://localhost:${PORT}`, 
                description: 'Servidor de Desenvolvimento',
            },
        ],
    },
    // Onde o swagger-jsdoc vai procurar os comentários da documentação:
    apis: ['./src/api/routes/*.js'], 
};

// Gerar a especificação
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Criar a rota /api-docs para servir a documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

logger.info(`Documentação da API disponível em http://localhost:${PORT}/api-docs`);


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

logger.info(`Configuração do MongoDB pronta.`);

// --- SEÇÃO 4: IMPORTAÇÃO DOS MODELS (SCHEMAS) ---

const Usuario = require('./api/models/Usuario.js');
const Sessao = require('./api/models/Sessao.js');

logger.info(`Models (Schemas) importados: Usuario, Sessao.`);

// --- SEÇÃO 5: DEFINIÇÃO DE ROTAS (ENDPOINTS DA API) ---

// --- 5.1 Importação das Rotas ---
// Importamos o arquivo de rotas de autenticação que acabamos de criar.
const authRoutes = require('./api/routes/auth.js');

logger.info(`Rotas importadas: authRoutes.`);

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

logger.info(`Rota pública '/' (health check) definida.`);

// --- 5.3 Rotas da Aplicação (Middleware de Roteamento) ---

// Aqui está a "mágica":
// Dizemos ao Express: "Qualquer requisição que comece com '/api/auth'
// deve ser gerenciada pelo nosso arquivo 'authRoutes'".
app.use('/api/auth', authRoutes);

logger.info(`Rotas da aplicação montadas em '/api/auth'.`);


/*
 * ===============================================
 * FIM DAS DEFINIÇÕES DE ROTAS
 * ===============================================
 */


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

logger.info(`Servidor iniciando...`);

// Inicia a aplicação
startServer();