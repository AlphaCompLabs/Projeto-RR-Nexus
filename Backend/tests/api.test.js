// tests/api.test.js

const request = require('supertest'); // Importa o Supertest
const app = require('../app.js'); // Importa o app (de app.js)
const mongoose = require('mongoose'); // Precisamos do Mongoose para conectar/desconectar
require('dotenv').config(); // Carrega o .env para pegar a MONGO_URI

// Importa os models para criar dados de teste
const Usuario = require('../models/Usuario.js');
const Sessao = require('../models/Sessao.js');

// === CONFIGURAÇÃO GLOBAL DOS TESTES (JEST) ===

beforeAll(async () => {
    // 1. Conecta ao banco de dados de teste ANTES de todos os testes
    await mongoose.connect(process.env.MONGO_CONNECTION_STRING);

    // 2. Limpa dados de testes antigos (A FORMA SEGURA)
    
    // 2a. Encontra os _ids de usuários de testes antigos
    const oldTestUsers = await Usuario.find({ username: /test-/ });
    const oldUserIds = oldTestUsers.map(user => user._id);

    // 2b. Limpa APENAS as sessões pertencentes a esses usuários antigos
    if (oldUserIds.length > 0) {
        await Sessao.deleteMany({ userId: { $in: oldUserIds } });
    }

    // 2c. Limpa os usuários de teste antigos
    await Usuario.deleteMany({ username: /test-/ });

    console.log("[Test Setup] Limpeza de dados de testes anteriores concluída.");
});

afterAll(async () => {
    try {
        console.log("\n[Test Cleanup] Iniciando limpeza do banco de dados...");

        // 1. Encontrar todos os usuários que criamos para este teste
        const testUsers = await Usuario.find({ username: /test-/ });
        
        // 2. Extrair os _ids desses usuários
        const userIds = testUsers.map(user => user._id);

        if (userIds.length > 0) {
            // 3. Deletar APENAS as sessões que pertencem a esses usuários
            const sessionDeleteResult = await Sessao.deleteMany({ userId: { $in: userIds } });
            console.log(`[Test Cleanup] ${sessionDeleteResult.deletedCount} sessões de teste removidas.`);

            // 4. Deletar os usuários de teste
            const userDeleteResult = await Usuario.deleteMany({ _id: { $in: userIds } });
            console.log(`[Test Cleanup] ${userDeleteResult.deletedCount} usuários de teste removidos.`);
        } else {
            console.log("[Test Cleanup] Nenhum usuário de teste para limpar.");
        }

    } catch (err) {
        console.error("Erro durante a limpeza dos testes:", err);
    } finally {
        // 5. Desconecta do banco DEPOIS de todos os testes
        await mongoose.disconnect();
        console.log("[Test Cleanup] Desconectado do MongoDB.");
    }
});

// =============================================
// === SUÍTE 1: TESTES DE SAÚDE (SMOKE TEST) ===
// =============================================

describe('GET / (Health Check)', () => {
    it('deve retornar status 200 e uma mensagem JSON de "online"', async () => {
        const response = await request(app)
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body.status).toBe('online');
        expect(response.body.message).toContain('API do Backend');
    });
});

// =============================================
// === SUÍTE 2: TESTES DE LOGIN (POST /login) ===
// =============================================

describe('POST /api/auth/login', () => {

    // Prepara o banco com um usuário de teste
    beforeAll(async () => {
        const testUser = new Usuario({
            username: 'test-user',
            password: 'password123' // O model 'Usuario.js' vai hashear isso
        });
        await testUser.save();
    });

    // TESTE 1: Senha Errada
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

    // TESTE 2: Usuário Inexistente
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

    // Teste de Sucesso (Caminho Feliz)
    it('deve retornar 200 e um sessionId em um login bem-sucedido', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'test-user',
                password: 'password123' // Credenciais corretas
            })
            .expect(200);

        // Verifica se a resposta contém o sessionId
        expect(response.body.sessionId).toBeDefined();
    });
});

// ========================================================
// === SUÍTE 3: TESTES DE VALIDAÇÃO (GET /session/validate) ===
// ========================================================

describe('GET /api/auth/session/validate', () => {

    let testUser;

    // Prepara o banco com um usuário
    beforeAll(async () => {
        testUser = new Usuario({
            username: 'test-validate-user',
            password: 'password123'
        });
        await testUser.save();
    });

    // TESTE 5: Sem Token
    it('Teste 5: deve retornar 401 se não for enviado um token', async () => {
        const response = await request(app)
            .get('/api/auth/session/validate')
            // Nenhum header 'Authorization' é enviado
            .expect(401);

        expect(response.body.error).toContain('Token de sessão não fornecido');
    });

    // TESTE 3: Token Falso
    it('Teste 3: deve retornar 401 se o token (sessionId) for falso', async () => {
        const response = await request(app)
            .get('/api/auth/session/validate')
            .set('Authorization', 'Bearer token-falso-123') // Envia um token inválido
            .expect(401);

        expect(response.body.error).toBe('Sessão inválida ou não encontrada.');
    });

    // TESTE 4: Token Expirado
    it('Teste 4: deve retornar 401 se o token estiver expirado', async () => {
        
        // 1. Cria manualmente uma sessão EXPIRADA no banco
        const expiredToken = 'token-expirado-abc';
        const dataDoPassado = new Date(Date.now() - (2 * 60 * 60 * 1000)); // 2 horas atrás

        const expiredSession = new Sessao({
            sessionId: expiredToken,
            userId: testUser._id,
            expiresAt: dataDoPassado // Data de expiração no passado
        });
        await expiredSession.save();

        // 2. Tenta validar usando o token expirado
        const response = await request(app)
            .get('/api/auth/session/validate')
            .set('Authorization', `Bearer ${expiredToken}`)
            .expect(401);

        expect(response.body.error).toBe('Sessão expirada. Por favor, faça login novamente.');
    });
});