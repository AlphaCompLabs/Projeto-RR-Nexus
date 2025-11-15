/* =====================================================================================
 * SERVIDOR BACKEND - TESTES DE INTEGRAÇÃO (API)
 * Arquivo: tests/api.test.js
 * Versão: 1.2.0 (Componente do Servidor v1.2.0)
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Define os testes de integração para os endpoints da API
 * de autenticação (/api/auth). Utiliza Jest e Supertest
 * para simular requisições HTTP e validar as respostas.
 * =====================================================================================
 */

// tests/api.test.js

//  'supertest' é a ferramenta padrão da indústria
// para testes de API (integração) em Node.js/Express.
const request = require('supertest');
const app = require('../app.js'); // Importa o app (de app.js)
const mongoose = require('mongoose'); // Necessário para gerenciar o estado do DB
require('dotenv').config(); // Carrega o .env para a string de conexão

//  Importar os models é necessário para
// "plantar" (seed) e "limpar" (cleanup) dados no DB.
const Usuario = require('../models/Usuario.js');
const Sessao = require('../models/Sessao.js');

// === CONFIGURAÇÃO GLOBAL DOS TESTES (JEST) ===

//  'beforeAll' é executado UMA VEZ antes de
// TODOS os testes neste arquivo. Perfeito para conectar ao DB.
beforeAll(async () => {
    // 1. Conecta ao banco de dados de teste
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

    // 2. Limpa dados de testes antigos (A FORMA SEGURA)
    //  Esta é uma prática de "defesa". Se um teste anterior
    // falhou e o 'afterAll' não rodou, isso garante que a
    // execução atual comece com um DB limpo.
    const oldTestUsers = await Usuario.find({ username: /test-/ });
    const oldUserIds = oldTestUsers.map(user => user._id);

    if (oldUserIds.length > 0) {
        await Sessao.deleteMany({ userId: { $in: oldUserIds } });
    }
    await Usuario.deleteMany({ username: /test-/ });

    console.log("[Test Setup] Limpeza de dados de testes anteriores concluída.");
});

//  'afterAll' é executado UMA VEZ depois que
// TODOS os testes neste arquivo (mesmo os que falharam) terminam.
afterAll(async () => {
    try {
        console.log("\n[Test Cleanup] Iniciando limpeza do banco de dados...");

        //  O 'afterAll' é o local correto para limpar os
        // dados criados PELA EXECUÇÃO ATUAL dos testes.
        const testUsers = await Usuario.find({ username: /test-/ });
        const userIds = testUsers.map(user => user._id);

        if (userIds.length > 0) {
            // Deleta dados relacionados PRIMEIRO (Sessões)
            const sessionDeleteResult = await Sessao.deleteMany({ userId: { $in: userIds } });
            console.log(`[Test Cleanup] ${sessionDeleteResult.deletedCount} sessões de teste removidas.`);

            // Deleta os dados principais (Usuários)
            const userDeleteResult = await Usuario.deleteMany({ _id: { $in: userIds } });
            console.log(`[Test Cleanup] ${userDeleteResult.deletedCount} usuários de teste removidos.`);
        } else {
            console.log("[Test Cleanup] Nenhum usuário de teste para limpar.");
        }

    } catch (err) {
        console.error("Erro durante a limpeza dos testes:", err);
    } finally {
        //  CRÍTICO! Sempre desconecte do DB,
        // especialmente em 'finally', para garantir que o processo de
        // teste possa ser encerrado corretamente.
        await mongoose.disconnect();
        console.log("[Test Cleanup] Desconectado do MongoDB.");
    }
});

// =============================================
// === SUÍTE 1: TESTES DE SAÚDE (SMOKE TEST) ===
// =============================================

//  'describe' agrupa testes relacionados.
// Uma suíte por rota ou por funcionalidade é um ótimo padrão.
describe('GET / (Health Check)', () => {
    
    //  'it' define um caso de teste individual.
    // O nome deve descrever o que o teste espera.
    it('deve retornar status 200 e uma mensagem JSON de "online"', async () => {
        const response = await request(app)
            .get('/')
            .expect('Content-Type', /json/) // Verifica o header
            .expect(200); // Verifica o status code

        //  'expect' é a asserção (verificação)
        // final. Verifique o corpo (body) da resposta.
        expect(response.body.status).toBe('online');
        expect(response.body.message).toContain('API do Backend');
    });
});

// =============================================
// === SUÍTE 2: TESTES DE LOGIN (POST /login) ===
// =============================================

describe('POST /api/auth/login', () => {

    //  Usar 'beforeAll' DENTRO de um 'describe'
    // é perfeito para "plantar" (seed) dados que serão usados
    // por todos os testes NESSA suíte.
    beforeAll(async () => {
        const testUser = new Usuario({
            username: 'test-user',
            password: 'password123' // O model 'Usuario.js' vai hashear isso
        });
        await testUser.save();
    });

    //  Testar "Caminhos Infelizes" (Sad Paths)
    // é tão (ou mais) importante quanto testar o sucesso.
    it('Teste 1: deve retornar 401 se a senha estiver errada', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'test-user',
                password: 'password-errada' // Senha errada
            })
            .expect(401);

        expect(response.body.error).toBe('Credenciais inválidas.');
    });

    it('Teste 2: deve retornar 401 se o usuário não existir', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'usuario-fantasma',
                password: 'password123'
            })
            .expect(401);

        expect(response.body.error).toBe('Credenciais inválidas.');
    });

    //  Testar o "Caminho Feliz" (Happy Path)
    // é o teste de sucesso principal.
    it('deve retornar 200 e um sessionId em um login bem-sucedido', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'test-user',
                password: 'password123' // Credenciais corretas
            })
            .expect(200);

        // Verifica se a resposta contém o que promete (o token)
        expect(response.body.sessionId).toBeDefined();
    });
});

// ========================================================
// === SUÍTE 3: TESTES DE VALIDAÇÃO (GET /session/validate) ===
// ========================================================

describe('GET /api/auth/session/validate', () => {

    let testUser;

    beforeAll(async () => {
        testUser = new Usuario({
            username: 'test-validate-user',
            password: 'password123'
        });
        await testUser.save();
    });

    it('Teste 5: deve retornar 401 se não for enviado um token', async () => {
        const response = await request(app)
            .get('/api/auth/session/validate')
            // Nenhum header 'Authorization' é enviado
            .expect(401);

        expect(response.body.error).toContain('Token de sessão não fornecido');
    });

    it('Teste 3: deve retornar 401 se o token (sessionId) for falso', async () => {
        const response = await request(app)
            .get('/api/auth/session/validate')
            .set('Authorization', 'Bearer token-falso-123') // Envia um token inválido
            .expect(401);

        expect(response.body.error).toBe('Sessão inválida ou não encontrada.');
    });

    //  Este é um "edge case" (caso de borda)
    // excelente. Você está *criando* o estado exato
    // (um token expirado no DB) para provar que a lógica
    // de expiração do controller funciona.
    it('Teste 4: deve retornar 401 se o token estiver expirado', async () => {
        
        // 1. Arrange (Preparar)
        const expiredToken = 'token-expirado-abc';
        const dataDoPassado = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 horas atrás

        const expiredSession = new Sessao({
            sessionId: expiredToken,
            userId: testUser._id,
            expiresAt: dataDoPassado // Data de expiração no passado
        });
        await expiredSession.save();

        // 2. Act (Agir)
        const response = await request(app)
            .get('/api/auth/session/validate')
            .set('Authorization', `Bearer ${expiredToken}`)
            .expect(401);

        // 3. Assert (Verificar)
        expect(response.body.error).toBe('Sessão expirada. Por favor, faça login novamente.');
    });
});