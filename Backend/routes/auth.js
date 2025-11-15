/* =====================================================================================
 * ARQUIVO DE ROTAS DE AUTENTICAÇÃO
 * Versão: 1.0.0
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Centraliza todas as definições de rotas relacionadas
 * à autenticação e sessão.
 * =====================================================================================
 */

const express = require('express');

//  Importar os controllers necessários para este grupo de rotas.
const authController = require('../controllers/authController.js');

//  Criar um 'Router' do Express.
// Ele funciona como um "mini-app" para agrupar rotas.
const router = express.Router(); 

/* =====================================================================================
 * DEFINIÇÃO DAS ROTAS
 * =====================================================================================
 */

// --- Rotas Públicas (Não exigem autenticação) ---

/**
 * Rota de Login
 * @route POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * Rota de Registro (Desenvolvimento)
 * @route POST /api/auth/register
 */
router.post('/register', authController.register);

/**
 * Rota para redefinir a senha
 * @route POST /api/auth/reset-password
 */
router.post('/reset-password', authController.resetPassword);


// --- Rotas Protegidas (Exigem o middleware de extração de token) ---

//  Middlewares de autenticação/autorização são
// aplicados antes da lógica do controller final.
// O Express executa a lista [middleware1, middleware2, ..., controllerFinal] em ordem.

/**
 * Rota de Validação de Sessão
 * @route GET /api/auth/session/validate
 */
router.get(
    '/session/validate', 
    authController.extractSessionFromHeader, // 1º: Extrai o token
    authController.validate                  // 2º: Valida o token extraído
);

/**
 * Rota de Logout
 * @route POST /api/auth/logout
 */
router.post(
    '/logout', 
    authController.extractSessionFromHeader, // 1º: Extrai o token
    authController.logout                    // 2º: Invalida o token extraído
);


//  Exportar o 'router' configurado para ser
// "montado" no arquivo principal (index.js ou app.js).
module.exports = router;