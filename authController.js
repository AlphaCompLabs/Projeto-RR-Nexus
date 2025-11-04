/* =====================================================================================
 * CONTROLLER DE AUTENTICAÇÃO
 * Versão: 1.0.0
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Este arquivo contém toda a lógica de negócios para os endpoints
 * de autenticação (register, login, validate, logout).
 * =====================================================================================
 */

// --- IMPORTAÇÕES ---
// Precisamos importar os mesmos módulos que a lógica usava no index.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Usuario = require('./models/Usuario.js'); // Importa o Model de Usuário
const Sessao = require('./models/Sessao.js');   // Importa o Model de Sessão

// Copiamos o logger do index.js
// (Uma melhoria futura seria mover isso para seu próprio módulo, ex: utils/logger.js)
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- LÓGICA DO CONTROLLER (EXPORTADA) ---

/**
 * Middleware para extrair o sessionId do header 'Authorization'.
 */
exports.extractSessionFromHeader = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn("Tentativa de acesso sem header 'Authorization' ou formato incorreto.");
        return res.status(401).json({ error: 'Token de sessão não fornecido ou mal formatado.' });
    }

    const sessionId = authHeader.split(' ')[1];
    if (!sessionId) {
        logger.warn("Header 'Authorization' presente, mas token (sessionId) ausente.");
        return res.status(401).json({ error: 'Token de sessão não fornecido.' });
    }

    req.sessionId = sessionId;
    next();
};

/**
 * Processa a tentativa de login de um usuário. (POST /login)
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            logger.warn("Tentativa de login com dados ausentes.");
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        const user = await Usuario.findOne({ username: username.toLowerCase() });

        if (!user) {
            logger.warn(`Tentativa de login falha (usuário não encontrado): ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Tentativa de login falha (senha incorreta) para o usuário: ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hora

        const newSession = new Sessao({
            sessionId: sessionId,
            userId: user._id,
            expiresAt: expiresAt
        });

        await newSession.save();
        logger.info(`Nova sessão criada para o usuário: ${user.username}`);

        res.status(200).json({
            message: 'Login realizado com sucesso!',
            sessionId: newSession.sessionId,
            username: user.username
        });

    } catch (err) {
        logger.error("Erro inesperado no endpoint /login:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * Valida um sessionId enviado pelo Frontend. (GET /session/validate)
 */
exports.validate = async (req, res) => {
    try {
        const { sessionId } = req; // Pega o ID da sessão do middleware

        const session = await Sessao.findOne({ sessionId: sessionId });

        if (!session) {
            logger.warn(`Tentativa de validação com sessionId inválido: ${sessionId}`);
            return res.status(401).json({ error: 'Sessão inválida ou não encontrada.' });
        }

        if (new Date() > session.expiresAt) {
            logger.warn(`Tentativa de validação com sessão expirada: ${sessionId}`);
            await Sessao.deleteOne({ _id: session._id });
            return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
        }

        await session.populate({
            path: 'userId',
            select: 'username _id'
        });

        if (!session.userId) {
            logger.warn(`Sessão ${sessionId} é válida, mas o usuário associado não foi encontrado. Removendo sessão órfã.`);
            await Sessao.deleteOne({ _id: session._id });
            return res.status(401).json({ error: 'Usuário associado à sessão não existe mais.' });
        }

        res.status(200).json({
            message: 'Sessão validada com sucesso.',
            userId: session.userId._id,
            username: session.userId.username,
            loginTime: session.createdAt,
            sessionId: session.sessionId,
            expiresAt: session.expiresAt
        });

    } catch (err) {
        logger.error("Erro inesperado no endpoint /session/validate:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * Invalida (deleta) a sessão de um usuário. (POST /logout)
 */
exports.logout = async (req, res) => {
    try {
        const { sessionId } = req; // Pega o ID da sessão do middleware

        const deletedSession = await Sessao.findOneAndDelete({ sessionId: sessionId });

        if (!deletedSession) {
            logger.warn(`Tentativa de logout com sessionId inválido ou já expirado: ${sessionId}`);
            return res.status(200).json({ message: 'Sessão não encontrada ou já invalidada.' });
        }

        logger.info(`Sessão invalidada com sucesso (Logout) para o userId: ${deletedSession.userId}`);

        res.status(200).json({
            message: 'Logout realizado com sucesso. Sessão invalidada.'
        });

    } catch (err) {
        logger.error("Erro inesperado no endpoint /logout:", err.message);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

/**
 * Rota temporária para criar usuários durante o desenvolvimento. (POST /register)
 */
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        const newUser = new Usuario({
            username: username,
            password: password
        });

        await newUser.save();
        logger.info(`Novo usuário de teste registrado: ${newUser.username}`);

        res.status(201).json({
            message: 'Usuário registrado com sucesso! (Senha hasheada)',
            username: newUser.username
        });

    } catch (err) {
        logger.error("Erro no /register:", err.message);
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Este nome de usuário já está em uso.' });
        }
        res.status(500).json({ error: err.message });
    }
};