/* =====================================================================================
 * SERVIDOR BACKEND - AUTENTICAÇÃO E SESSÃO CENTRALIZADA
 * Arquivo: models/Sessao.js
 * Versão: 1.2.0 (Componente do Servidor v1.2.0)
 *
 * Autor: [Seu Nome / Nome da Equipe]
 * Descrição: Define o schema do Mongoose (Model) para a coleção 'sessoes'.
 * Este modelo armazena os tokens de sessão ativos, ligando-os
 * a um usuário e controlando seu tempo de expiração.
 * =====================================================================================
 */

// --- SEÇÃO 0: IMPORTAÇÕES ---

const mongoose = require('mongoose');

//  Desestruturar 'Schema' é uma convenção que torna o
// código mais limpo e legível.
const Schema = mongoose.Schema;

// --- SEÇÃO 1: DEFINIÇÃO DO SCHEMA (sessaoSchema) ---
//  O schema é o "contrato" dos dados. Defina tipos,
// validações (required), restrições (unique) e referências (ref) aqui.

const sessaoSchema = new Schema(
    {
        /**
         * O token de sessão único (gerado via crypto) que será enviado
         * e armazenado pelo cliente (ex: em um cookie).
         */
        sessionId: {
            type: String,
            required: [true, 'O sessionId é obrigatório.'], // Mensagem de erro customizada
            unique: true,
            index: true, //  Indexar campos usados em 'findOne' (validação).
        },

        /**
         * O ID do usuário (da coleção 'usuarios') ao qual esta sessão pertence.
         * É o "link" entre a sessão e o usuário.
         */
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario', //  'ref' é crucial para usar 'populate()'.
            required: [true, 'A sessão deve estar vinculada a um usuário (userId).'],
            index: true, //  Indexar para buscas (ex: invalidar sessões do user).
        },

        /**
         * O timestamp exato de quando esta sessão deve ser considerada inválida.
         * Usado em conjunto com o índice TTL.
         */
        expiresAt: {
            type: Date,
            required: [true, 'A data de expiração é obrigatória.'],
        }
    },
    {
        /**
         * Opções do Schema:
         * timestamps: true -> Adiciona automaticamente os campos 'createdAt' e 'updatedAt'
         * em cada documento. Útil para auditoria e debugging.
         */
        //  'timestamps: true' é uma melhor prática para
        // quase todos os models.
        timestamps: true,
        //  Definir 'collection' explicitamente evita
        // surpresas com a pluralização automática do Mongoose.
        collection: 'sessoes'
    }
);

// --- SEÇÃO 2: ÍNDICES DO MONGODB (Otimização) ---

/**
 * Índice TTL (Time-To-Live).
 * Esta é uma otimização crucial para sessões.
 * Ela instrui o MongoDB a verificar automaticamente o campo 'expiresAt' e
 * excluir qualquer documento 0 segundos após essa data ser atingida.
 *
 * Isso garante que sessões expiradas sejam limpas automaticamente do banco,
 * mantendo a coleção performática e segura.
 */
//  Índices complexos ou de otimização (como TTL)
// são definidos fora do schema principal para maior clareza.
sessaoSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// --- SEÇÃO 3: EXPORTAÇÃO DO MODEL ---

/**
 * Compila o schema em um Model do Mongoose.
 * O Mongoose automaticamente procurará/criará uma coleção chamada 'sessoes'
 * (o plural de 'Sessao') no banco de dados.
 */
module.exports = mongoose.model('Sessao', sessaoSchema);