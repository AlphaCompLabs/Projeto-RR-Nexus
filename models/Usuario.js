/* =====================================================================================
 * SERVIDOR BACKEND - AUTENTICAÇÃO E SESSÃO CENTRALIZADA
 * Arquivo: models/Usuario.js
 * Versão: 1.2.0 (Componente do Servidor v1.2.0)
 *
 * Autor: Equipe BackEnd - Diogo Freitas e Caio Silveira
 * Descrição: Define o schema do Mongoose (Model) para a coleção 'usuarios'.
 * Este modelo inclui a lógica de hashing automático de senha
 * antes de salvar o documento (hook pre-save).
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Biblioteca para hashing de senhas
const Schema = mongoose.Schema;

// Define a força do "salt" para o hash. 10-12 é o padrão da indústria.
const SALT_WORK_FACTOR = 10;

// --- SEÇÃO 1: DEFINIÇÃO DO SCHEMA (usuarioSchema) ---

const usuarioSchema = new Schema(
    {
        /**
         * O nome de usuário (login).
         * É único e armazenado em minúsculas para evitar duplicidade
         * (ex: 'Admin' e 'admin' são considerados o mesmo usuário).
         */
        username: {
            type: String,
            required: [true, 'O nome de usuário é obrigatório.'],
            unique: true,    // Garante que não há dois usuários com o mesmo nome
            lowercase: true, // Força o armazenamento em minúsculas
            trim: true,      // Remove espaços em branco no início e fim
            index: true,     // Otimiza consultas por 'username'
        },

        /**
         * O hash da senha do usuário.
         * A senha em texto puro NUNCA é armazenada.
         * O hash é gerado automaticamente pelo middleware 'pre-save' (ver Seção 2).
         */
        password: {
            type: String,
            required: [true, 'A senha é obrigatória.'],
            // Nota: Não defina 'lowercase' ou 'trim' aqui, pois
            // alteraria o hash.
        }
    },
    {
        /**
         * Opções do Schema:
         * timestamps: true -> Adiciona automaticamente 'createdAt' e 'updatedAt'.
         * Útil para auditoria e para saber quando o usuário se registrou.
         */
        timestamps: true
    }
);

// --- SEÇÃO 2: MIDDLEWARE (HOOKS) DO SCHEMA ---

/**
 * Middleware "pre-save" do Mongoose.
 * Esta função é executada AUTOMATICAMENTE pelo Mongoose ANTES de um
 * documento 'Usuario' ser salvo no banco de dados (.save()).
 *
 * Objetivo: Garantir que a senha seja sempre armazenada como um hash seguro.
 *
 * Usamos 'function()' (e não uma arrow function '() =>') para ter
 * acesso ao contexto 'this', que referencia o documento prestes a ser salvo.
 */
usuarioSchema.pre('save', async function(next) {
    // 'this' é o documento do usuário
    const user = this;

    // 1. Verifica se a senha foi modificada (ou se é um novo usuário).
    // Se não foi, pulamos o hashing (ex: usuário está só atualizando o username).
    if (!user.isModified('password')) {
        return next();
    }

    // 2. Se a senha é nova ou foi modificada, geramos o hash.
    try {
        // Gera um "salt" (fator de aleatoriedade)
        const salt = await bcrypt.genSalt(SALT_WORK_FACTOR);

        // Substitui a senha em texto puro (user.password) pelo seu hash
        user.password = await bcrypt.hash(user.password, salt);

        // Continua com a operação de 'save'
        next();
    } catch (error) {
        // Se o hashing falhar, impede o 'save' e passa o erro adiante.
        console.error("Erro ao gerar hash da senha para o usuário:", user.username, error);
        next(error);
    }
});

// --- SEÇÃO 3: MÉTODOS DE INSTÂNCIA (Exemplo futuro) ---

/**
 * NOTA: Embora não esteja implementado aqui, um método para *comparar*
 * a senha seria adicionado aqui.
 *
 * Exemplo (você já faz isso no /login, mas centralizar é uma boa prática):
 *
 * usuarioSchema.methods.comparePassword = function(candidatePassword) {
 * return bcrypt.compare(candidatePassword, this.password);
 * };
 *
 * Uso no /login:
 * const isMatch = await user.comparePassword(password);
 */


// --- SEÇÃO 4: EXPORTAÇÃO DO MODEL ---

/**
 * Compila o schema em um Model.
 * O Mongoose criará/procurará a coleção 'usuarios' (plural de 'Usuario')
 * no MongoDB.
 */
module.exports = mongoose.model('Usuario', usuarioSchema);