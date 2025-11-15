/* =====================================================================================
 * CONTROLLER DE AUTENTICAÇÃO
 * Versão: 1.1.0 (Refatorado para Error Handler Global)
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Contém a lógica de negócios para autenticação.
 * Esta versão passa os erros (catch) para o middleware
 * de erro global (index.js) usando next(err).
 * =====================================================================================
 */

// --- IMPORTAÇÕES ---
// Importações no topo, agrupadas por tipo (libs, models, utils).
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario.js');
const Sessao = require('../models/Sessao.js');
// const mongoose = require('mongoose'); // Removido pois não é usado diretamente.

// --- LOGGER ---
// Um logger centralizado (mesmo que simples).
// Em uma app maior, considere bibliotecas como Winston ou Pino.
const logger = {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, error) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || ''),
};

// --- LÓGICA DO CONTROLLER (EXPORTADA) ---

/**
 * Middleware para extrair o sessionId do header 'Authorization'.
 * (Este já usava 'next' corretamente, então não muda)
 * * @route MIDDLEWARE
 */
exports.extractSessionFromHeader = (req, res, next) => {
    //  Middlewares devem fazer uma coisa: ou retornar um erro,
    // ou modificar o 'req' e chamar 'next()'.
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn("Tentativa de acesso sem header 'Authorization' ou formato incorreto.");
        //  Respostas de erro devem ser claras e com status HTTP correto.
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
 * Processa a tentativa de login de um usuário.
 * Implementa a política de "Sessão Única",
 * invalidando sessões antigas no momento do novo login.
 * * @route POST /login
 */
exports.login = async (req, res, next) => { 
    //  Todos os controllers de rota devem ser 'async' e 
    // envoltos em 'try...catch'.
    try {
        const { username, password } = req.body;

        //  Validação de entrada (input validation) no início da função.
        if (!username || !password) {
            logger.warn("Tentativa de login com dados ausentes.");
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        //  Padronizar lookups (ex: usar lower-case para usernames).
        const user = await Usuario.findOne({ username: username.toLowerCase() });

        if (!user) {
            logger.warn(`Tentativa de login falha (usuário não encontrado): ${username}`);
            //  Resposta genérica para falha de login (evita enumeração de usuário).
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            logger.warn(`Tentativa de login falha (senha incorreta) para o usuário: ${username}`);
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Política de Sessão Única:
        logger.info(`Invalidando sessões antigas para o usuário: ${user.username}`);
        await Sessao.deleteMany({ userId: user._id });
        
        // --- Criação da Nova Sessão ---
        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + (60 * 60 * 1000)); // 1 hora

        const newSession = new Sessao({
            sessionId: sessionId,
            userId: user._id,
            expiresAt: expiresAt
        });

        await newSession.save();
        logger.info(`Nova sessão (única) criada para o usuário: ${user.username}`);

        //  Resposta de sucesso (200 ou 201) clara e com dados úteis.
        res.status(200).json({
            message: 'Login realizado com sucesso!',
            sessionId: newSession.sessionId,
            username: user.username
        });

    } catch (err) {
        //  O bloco 'catch' DEVE delegar erros inesperados
        // para o handler global usando next(err).
        logger.error("Erro inesperado no endpoint /login:", err.message);
        next(err); 
    }
};

/**
 * Valida um sessionId enviado pelo Frontend.
 * * @route GET /session/validate
 */
exports.validate = async (req, res, next) => { 
    try {
        //  Confiar no 'req' modificado pelo middleware.
        const { sessionId } = req; 

        const session = await Sessao.findOne({ sessionId: sessionId });

        if (!session) {
            logger.warn(`Tentativa de validação com sessionId inválido: ${sessionId}`);
            return res.status(401).json({ error: 'Sessão inválida ou não encontrada.' });
        }

        //  Lógica de negócio (como expiração) tratada explicitamente.
        if (new Date() > session.expiresAt) {
            logger.warn(`Tentativa de validação com sessão expirada: ${sessionId}`);
            // "Housekeeping": Limpar sessões expiradas ao encontrá-las.
            await Sessao.deleteOne({ _id: session._id });
            return res.status(401).json({ error: 'Sessão expirada. Por favor, faça login novamente.' });
        }

        //  Usar 'populate' para evitar queries extras.
        await session.populate({
            path: 'userId',
            select: 'username _id' // Selecionar apenas os campos necessários.
        });

        // "Defensive Coding": Checar se o usuário linkado ainda existe.
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
        next(err); // Passa o erro para o handler global
    }
};

/**
 * Invalida (deleta) a sessão de um usuário.
 * * @route POST /logout
 */
exports.logout = async (req, res, next) => { 
    try {
        const { sessionId } = req;

        //  Usar métodos atômicos do DB quando possível.
        const deletedSession = await Sessao.findOneAndDelete({ sessionId: sessionId });

        if (!deletedSession) {
            //  Logout é idempotente. Se a sessão não existe,
            // não é um erro, apenas logamos e retornamos sucesso (200).
            logger.warn(`Tentativa de logout com sessionId inválido ou já expirado: ${sessionId}`);
            return res.status(200).json({ message: 'Sessão não encontrada ou já invalidada.' });
        }

        logger.info(`Sessão invalidada com sucesso (Logout) para o userId: ${deletedSession.userId}`);

        res.status(200).json({
            message: 'Logout realizado com sucesso. Sessão invalidada.'
        });

    } catch (err) {
        logger.error("Erro inesperado no endpoint /logout:", err.message);
        next(err); // Passa o erro para o handler global
    }
};

/**
 * Rota temporária para criar usuários durante o desenvolvimento.
 * * @route POST /register
 */
exports.register = async (req, res, next) => { 
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        const newUser = new Usuario({
            username: username,
            password: password
            // Confiar no 'pre-save' hook do Mongoose Model
            // para fazer o hashing da senha (separação de responsabilidades).
        });

        await newUser.save();
        logger.info(`Novo usuário de teste registrado: ${newUser.username}`);

        res.status(201).json({ // 201 Created é o status correto para 'register'
            message: 'Usuário registrado com sucesso! (Senha hasheada)',
            username: newUser.username
        });

    } catch (err) {
        //  Tratar erros *esperados* (como 'duplicate key')
        // antes de passar para o handler global.
        logger.error("Erro no /register:", err.message);
        
        if (err.code === 11000) { // Erro de duplicidade do MongoDB
            return res.status(409).json({ error: 'Este nome de usuário já está em uso.' }); // 409 Conflict
        }
        
        // Para TODOS OS OUTROS erros (ex: falha de validação, DB offline),
        // passamos para o handler global.
        next(err); 
    }
};

/**
 * Redefine a senha de um usuário (Fluxo "Esqueci minha Senha" simplificado).
 * * @route POST /reset-password
 */
exports.resetPassword = async (req, res, next) => { 
    try {
        const { username, newPassword } = req.body;

        if (!username || !newPassword) {
            return res.status(400).json({ error: 'Nome de usuário e nova senha são obrigatórios.' });
        }

        const user = await Usuario.findOne({ username: username.toLowerCase() });

        if (!user) {
            //  Usar 404 (Not Found) quando o recurso principal (usuário) não é achado.
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        user.password = newPassword;
        await user.save(); // O hook de hashing roda aqui novamente

        logger.info(`Senha redefinida com sucesso para o usuário: ${username}`);
        res.status(200).json({ message: 'Senha redefinida com sucesso.' });

    } catch (err) {
        logger.error("Erro no /reset-password:", err.message);
        next(err); // Passa o erro para o handler global
    }
};