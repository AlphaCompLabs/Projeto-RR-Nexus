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
// 1. Criamos um 'Router' do Express. Ele funciona como um "mini-app" para agrupar rotas.
const router = express.Router(); 

// 2. Importamos o controller (usando ../ para voltar um diretório)
const authController = require('../../../authController.js');

/* =====================================================================================
 * DEFINIÇÃO DAS ROTAS
 * =====================================================================================
 */

// --- Rotas Públicas ---

// Rota de Login
// Corresponde a: POST /api/auth/login
router.post('/login', authController.login);

// Rota de Registro (Desenvolvimento)
// Corresponde a: POST /api/auth/register
router.post('/register', authController.register);


// --- Rotas Protegidas (Exigem o middleware de extração de token) ---

// Rota de Validação de Sessão
// Corresponde a: GET /api/auth/session/validate
router.get('/session/validate', authController.extractSessionFromHeader, authController.validate);

// Rota de Logout
// Corresponde a: POST /api/auth/logout
router.post('/logout', authController.extractSessionFromHeader, authController.logout);


// 3. Exportamos o router configurado para que o index.js possa usá-lo
module.exports = router;