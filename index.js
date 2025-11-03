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

// --- 5.1 Middleware de Autenticação (Extração de Token) --- 
/**
 * Middleware para extrair o sessionId do header 'Authorization'.
 * Este middleware padroniza a extração do token Bearer, evitando duplicação
 * de código nos endpoints protegidos.
 *
 * Se o token for encontrado, ele o anexa a 'req.sessionId' e passa para o
 * próximo handler. Se não, ele retorna um erro 401.
 */
const extractSessionFromHeader = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    // 1. Validar o formato do Header (Authorization: Bearer <token>)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn("Tentativa de acesso sem header 'Authorization' ou formato incorreto.");
        return res.status(401).json({ error: 'Token de sessão não fornecido ou mal formatado.' });
    }

    // 2. Isolar o token e anexar à requisição
    const sessionId = authHeader.split(' ')[1];
    if (!sessionId) {
        logger.warn("Header 'Authorization' presente, mas token (sessionId) ausente.");
        return res.status(401).json({ error: 'Token de sessão não fornecido.' });
    }

    req.sessionId = sessionId; // Anexa o token para uso no próximo endpoint
    next(); // Passa para o próximo middleware ou rota
};


// --- 5.2 Rotas Públicas (Health & Auth) ---

/**
 * Rota de "saúde" (health check).
 */
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'online', 
        message: 'API do Backend (Sessão Centralizada) está funcionando!',
        timestamp: new Date().toISOString()
    });
});

/**
 * Processa a tentativa de login de um usuário.
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
        const user = await Usuario.findOne({ username: username.toLowerCase() });

        // 3. Verificação de Credenciais
        if (!user) {
            logger.warn(`Tentativa de login falha (usuário não encontrado): ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 4. Comparação de Senha
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Tentativa de login falha (senha incorreta) para o usuário: ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // 5. Geração de Sessão
        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hora

        // 6. Armazenamento da Sessão
        const newSession = new Sessao({
            sessionId: sessionId,
            userId: user._id,
            expiresAt: expiresAt
        });

        await newSession.save();
        logger.info(`Nova sessão criada para o usuário: ${user.username}`);

        // 7. Resposta ao Cliente
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            sessionId: newSession.sessionId,
            username: user.username
        });

    } catch (err) {
        // 8. Tratamento de Erro Genérico
        logger.error("Erro inesperado no endpoint /login:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// --- 5.3 Rotas Protegidas (Sessão) --- 

/**
 * Valida um sessionId enviado pelo Frontend.
 * Usa o middleware 'extractSessionFromHeader' para obter o token.
 */
app.get('/session/validate', extractSessionFromHeader, async (req, res) => {
    try {
        // 1. Obter o sessionId (já extraído pelo middleware)
        const { sessionId } = req; // Ou 'req.sessionId'

        // 2. Buscar a sessão no banco de dados
        const session = await Sessao.findOne({ sessionId: sessionId });

        // 3. Se a sessão não for encontrada
        if (!session) {
            logger.warn(`Tentativa de validação com sessionId inválido: ${sessionId}`);
            return res.status(401).json({ error: 'Sessão inválida ou não encontrada.' });
        }

        // 4. Verificar se a sessão expirou
        // Nota: O índice TTL no Model 'Sessao' já faz a limpeza, mas esta
        // verificação em tempo real é crucial para barrar requisições.
        if (new Date() > session.expiresAt) {
            logger.warn(`Tentativa de validação com sessão expirada: ${sessionId}`);
            await Sessao.deleteOne({ _id: session._id }); // Limpeza imediata
            return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
        }

        // --- SESSÃO VÁLIDA ---

        // 5. Buscar (popular) os dados do usuário associado
        await session.populate({
            path: 'userId',
            select: 'username' // Pega apenas o 'username' do usuário
        });

        // 6. [FIX CRÍTICO] Verificar se o usuário "populado" existe
        // Se o usuário foi deletado, session.userId será 'null'.
        // Acessar 'session.userId.username' causaria um erro 500.
        if (!session.userId) {
            logger.warn(`Sessão ${sessionId} é válida, mas o usuário associado não foi encontrado. Removendo sessão órfã.`);
            await Sessao.deleteOne({ _id: session._id }); // Limpa sessão órfã
            return res.status(401).json({ error: 'Usuário associado à sessão não existe mais.' });
        }

        // 7. Responder ao Frontend com os dados
        res.status(200).json({
            message: 'Sessão validada com sucesso.',
            username: session.userId.username,
            loginTime: session.createdAt, // (Do 'timestamps: true' no Schema)
            sessionId: session.sessionId,
            expiresAt: session.expiresAt
        });

    } catch (err) {
        // 8. Tratamento de Erro Genérico
        logger.error("Erro inesperado no endpoint /session/validate:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

/**
 * Invalida (deleta) a sessão de um usuário do banco de dados.
 * Usa o middleware 'extractSessionFromHeader' para obter o token.
 */
app.post('/logout', extractSessionFromHeader, async (req, res) => {
    try {
        // 1. Obter o sessionId (já extraído pelo middleware)
        const { sessionId } = req;

        // 2. Buscar e Deletar a sessão
        const deletedSession = await Sessao.findOneAndDelete({ sessionId: sessionId });

        // 3. Se a sessão não foi encontrada (idempotência)
        // (O cliente quer estar deslogado. Se a sessão já não existe, o objetivo foi atingido)
        if (!deletedSession) {
            logger.warn(`Tentativa de logout com sessionId inválido ou já expirado: ${sessionId}`);
            return res.status(200).json({ message: 'Sessão não encontrada ou já invalidada.' });
        }

        // --- SUCESSO! SESSÃO DELETADA ---
        logger.info(`Sessão invalidada com sucesso (Logout) para o userId: ${deletedSession.userId}`);

        // 4. Responder ao Frontend com sucesso
        res.status(200).json({
            message: 'Logout realizado com sucesso. Sessão invalidada.'
        });

    } catch (err) {
        // 5. Tratamento de Erro Genérico
        logger.error("Erro inesperado no endpoint /logout:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});


// --- 5.4 Rota de Desenvolvimento (Registro Temporário) ---

/**
 * ATENÇÃO: Rota temporária para criar usuários durante o desenvolvimento.
 * Em um ambiente de produção, esta rota deve ser removida ou
 * protegida por um nível de administrador.
 */
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        // O 'pre-save' hook no Model 'Usuario' cuida do hashing
        const newUser = new Usuario({
            username: username, // O 'lowercase: true' no schema cuida da normalização
            password: password
        });

        await newUser.save();
        logger.info(`Novo usuário de teste registrado: ${newUser.username}`);

        res.status(201).json({
            message: 'Usuário registrado com sucesso! (Senha hasheada)',
            username: newUser.username
        });

    } catch (err) {
        // Erro comum aqui é 'E11000 duplicate key' (usuário já existe)
        logger.error("Erro no /register:", err.message);
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Este nome de usuário já está em uso.' }); // 409 Conflict
        }
        res.status(500).json({ error: err.message });
    }
});

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