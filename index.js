/* =====================================================================================
 * SERVIDOR BACKEND - AUTENTICAÇÃO E SESSÃO CENTRALIZADA
 * Versão: 1.2.0 (Implementação do Endpoint POST /login)
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Este script (index.js) implementa a API central para gerenciamento
 * de usuários e sessões. Esta versão adiciona a rota de
 * autenticação e criação de sessão
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES E CONFIGURAÇÃO INICIAL ---

// Módulos principais do Node e da aplicação
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Para hashing de senhas
const crypto = require('crypto');   // Para geração de tokens de sessão seguros

// Carrega variáveis de ambiente do .env para process.env
// Importante: Faça isso antes de usar qualquer variável de process.env
require('dotenv').config();

// Módulos de logging (usando console nativo por enquanto)
// Para produção, considere bibliotecas como Winston ou Pino.
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
// Habilita o servidor a entender e processar corpos de requisição em formato JSON.
app.use(express.json());

// TODO: Implementar middleware de CORS (Cross-Origin Resource Sharing) se o frontend
// estiver em um domínio diferente.
// Ex: const cors = require('cors'); app.use(cors({ origin: 'http://seu-frontend.com' }));

logger.info("Middlewares essenciais configurados.");

// --- SEÇÃO 3: CONEXÃO COM O BANCO DE DADOS (MONGODB) ---

const MONGO_URI = process.env.MONGO_CONNECTION_STRING;

// Verificação crítica de inicialização
if (!MONGO_URI) {
    logger.error("Erro Fatal: A MONGO_CONNECTION_STRING não foi definida no arquivo .env.");
    process.exit(1); // Encerra o processo se a string de conexão estiver ausente
}

/**
 * Função assíncrona para estabelecer a conexão com o MongoDB.
 * Utiliza mongoose.connect e gerencia o sucesso ou falha da conexão inicial.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        logger.info("MongoDB conectado com sucesso!");
    } catch (err) {
        logger.error("Falha ao conectar ao MongoDB:", err.message);
        process.exit(1); // Encerra o processo em caso de falha na conexão
    }
};

// --- SEÇÃO 4: IMPORTAÇÃO DOS MODELS (SCHEMAS) ---

// Carrega as definições de schema do Mongoose para 'Usuario' e 'Sessao'
// É uma boa prática importá-los após a configuração da DB, mas antes das rotas.
const Usuario = require('./models/Usuario.js');
const Sessao = require('./models/Sessao.js');

// --- SEÇÃO 5: DEFINIÇÃO DE ROTAS (ENDPOINTS DA API) ---

// --- 5.1 Endpoint: Health Check (GET /) ---
/**
 * Rota de "saúde" (health check).
 * Usada para verificar se o serviço está no ar e respondendo.
 */
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'API do Backend (Sessão Centralizada) está funcionando!',
        timestamp: new Date().toISOString()
    });
});

// --- 5.2 Endpoint: Autenticação de Usuário (POST /login) --- 
/**
 * Processa a tentativa de login de um usuário.
 * Recebe: { "username": "...", "password": "..." }
 * Retorna: { "message": "...", "sessionId": "...", "username": "..." } em caso de sucesso.
 * Retorna: { "error": "..." } em caso de falha.
 */
app.post('/login', async (req, res) => {
    try {
        // 1. Extração e Validação de Entrada
        const { username, password } = req.body;

        if (!username || !password) {
            logger.warn("Tentativa de login com dados ausentes.");
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        // 2. Busca do Usuário
        // Normaliza o username para minúsculas para evitar duplicidade (ex: 'Admin' vs 'admin')
        const user = await Usuario.findOne({ username: username.toLowerCase() });

        // 3. Verificação de Credenciais
        // Nota de Segurança: Usamos uma resposta genérica ("Credenciais inválidas")
        // para falha de usuário ou senha. Isso previne "enumeração de usuários".
        if (!user) {
            logger.warn(`Tentativa de login falha (usuário não encontrado): ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
        }

        // 4. Comparação de Senha
        // Compara a senha enviada (plaintext) com o hash armazenado no banco.
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Tentativa de login falha (senha incorreta) para o usuário: ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' }); // 401 Unauthorized
        }

        // --- AUTENTICAÇÃO BEM-SUCEDIDA ---

        // 5. Geração de Sessão
        // Cria um token de sessão criptograficamente seguro.
        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // Expira em 1 hora

        // 6. Armazenamento da Sessão
        const newSession = new Sessao({
            sessionId: sessionId,
            userId: user._id, // Referência ao documento do usuário
            expiresAt: expiresAt
        });

        await newSession.save();
        logger.info(`Nova sessão criada para o usuário: ${user.username}`);

        // 7. Resposta ao Cliente
        // O cliente (frontend) deve armazenar este 'sessionId' (preferencialmente
        // em um httpOnly cookie) para autenticar requisições futuras.
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            sessionId: newSession.sessionId,
            username: user.username
        });

    } catch (err) {
        // 8. Tratamento de Erro Genérico
        // Captura qualquer erro inesperado (ex: falha de conexão com o DB
        // durante o .save() ou .findOne()).
        logger.error("Erro inesperado no endpoint /login:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

// --- 5.3 Endpoints Futuros (TODO) ---

// TODO: Card 7: Implementar Endpoint: GET /session/validate
// Deve receber um sessionId (via Header ou Cookie) e verificar se é válido e
// não expirou, retornando os dados do usuário.

// TODO: Card 8: Implementar Endpoint: POST /logout
// Deve receber um sessionId e removê-lo do banco de dados (invalidar a sessão).


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

// Inicia a aplicação
startServer();