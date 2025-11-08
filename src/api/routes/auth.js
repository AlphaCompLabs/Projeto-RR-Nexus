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
const router = express.Router();
const authController = require('../controllers/authController.js');

/**
 * @swagger
 * tags:
 *   - name: Autenticação
 *     description: Endpoints para login, registro e gerenciamento de sessão
 */

/* =====================================================================================
 * DEFINIÇÃO DAS ROTAS
 * ===================================================================================== 
 */

// --- Rotas Públicas ---

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Realiza o login do usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: O e-mail do usuário.
 *               senha:
 *                 type: string
 *                 format: password
 *                 description: A senha do usuário.
 *             example:
 *               email: "usuario@email.com"
 *               senha: "senha123"
 *     responses:
 *       200:
 *         description: Login bem-sucedido. Retorna a sessão e o usuário.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessaoResponse'
 *       400:
 *         description: Credenciais inválidas ou corpo da requisição mal formatado.
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo usuário (Desenvolvimento)
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegister'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         description: Dados inválidos ou e-mail já em uso.
 */
router.post('/register', authController.register);

// --- Rotas Protegidas ---

/**
 * @swagger
 * /api/auth/session/validate:
 *   get:
 *     summary: Valida a sessão atual (via header)
 *     tags: [Autenticação]
 *     parameters:
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         required: true
 *         description: O token de sessão (gerado pelo /login) a ser validado.
 *     responses:
 *       200:
 *         description: Sessão válida.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sessao'
 *       401:
 *         description: Não autorizado (token inválido ou expirado).
 */
router.get(
  '/session/validate',
  authController.extractSessionFromHeader,
  authController.validate
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Desloga o usuário (invalida a sessão)
 *     tags: [Autenticação]
 *     parameters:
 *       - in: header
 *         name: x-session-token
 *         schema:
 *           type: string
 *         required: true
 *         description: O token de sessão (gerado pelo /login) a ser invalidado.
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso.
 *       401:
 *         description: Não autorizado.
 */
router.post(
  '/logout',
  authController.extractSessionFromHeader,
  authController.logout
);

module.exports = router;