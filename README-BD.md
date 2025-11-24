# 🗄️ Documentação do Banco de Dados (MongoDB)

Este diretório contém a documentação da camada de persistência de dados do projeto de **Arquitetura Distribuída com Balanceamento DNS**.

O banco de dados escolhido foi o **MongoDB (Atlas)**, configurado para atuar como o ponto central de verdade para usuários e, crucialmente, para o gerenciamento de sessões distribuídas ("Cadernão Central").

---

## ⚙️ Configurações Gerais

* **Cluster:** NetvisionBD
* **Database Name:** `granada`
* **Role:** Armazenamento de Usuários e Gestão de Sessões Centralizada.

> **⚠️ Importante sobre a Conexão:**
> A string de conexão deve apontar explicitamente para o banco `granada`.
> Exemplo: `mongodb+srv://<user>:<pass>@netvisionbd.vzphu9o.mongodb.net/granada`

---

## 📂 Coleções (Collections)

O banco de dados `granada` é composto por duas coleções principais:

### 1. `usuarios`
Responsável por armazenar as credenciais e dados de perfil dos usuários.

* **Campos do Documento (Schema):**
    ```json
    {
      "_id": ObjectId("..."),
      "username": "fulano",           // Identificador do usuário
      "password": "$2b$10$...",      // Hash seguro (Bcrypt)
      "createdAt": "2025-11-20...",  // Data de criação
      "updatedAt": "2025-11-20...",  // Data de atualização
      "__v": 0
    }
    ```

* **Índices Configurados:**
    | Nome do Índice | Campo | Tipo | Função |
    | :--- | :--- | :--- | :--- |
    | `_id_` | `_id` | Padrão | Chave primária padrão do MongoDB. |
    | **`username_1`** | `username` | **UNIQUE** | Garante que não existam dois usuários com o mesmo login e acelera a autenticação. |

---

### 2. `sessoes`
Esta é a coleção crítica para o funcionamento do balanceamento de carga Round-Robin. Ela atua como a **Sessão Centralizada**, permitindo que o usuário navegue entre diferentes servidores HTTP sem ser deslogado.

* **Estratégia de Persistência:**
    Utiliza-se o recurso de **TTL (Time-To-Live)** do MongoDB. Documentos nesta coleção possuem um tempo de vida definido. O próprio banco de dados se encarrega de remover sessões expiradas, garantindo limpeza automática e performance.

* **Índices Configurados (Visualizados no Atlas):**
    Esta coleção possui índices otimizados para busca e expiração automática.

    | Nome do Índice | Campo | Tipo | Função |
    | :--- | :--- | :--- | :--- |
    | `_id_` | `_id` | Padrão | Identificador interno. |
    | **`sessionId_1`** | `sessionId` | **UNIQUE** | Garante que o ID da sessão (Cookie) seja único no sistema. |
    | **`data_expiracao_1`**| `data_expiracao`| **TTL** | Índice configurado manualmente para expiração automática da sessão. |
    | **`expiresAt_1`** | `expiresAt` | **TTL** | Índice de expiração (geralmente gerenciado por ORMs como Mongoose) para redundância na limpeza de sessões antigas. |
    | `userId_1` | `userId` | Regular | Otimiza a busca de todas as sessões ativas de um usuário específico. |

---

## 🚀 Como a Solução Resolve o Problema do DNS

1.  **O Problema:** O DNS distribui o tráfego em círculo (Round Robin) e não sabe se o usuário já fez login no "Servidor A". Se o DNS mandar o usuário para o "Servidor B", a sessão local seria perdida.
2.  **A Solução (`granada`):**
    * Quando o usuário loga, o servidor cria um documento na coleção `sessoes`.
    * O navegador recebe um ID de sessão.
    * Independente de para qual servidor o DNS aponte (A, B ou C), o servidor consulta a coleção `sessoes` no MongoDB.
    * Se o documento existir e não tiver expirado (gerenciado pelos índices TTL), o acesso é liberado.

---

## 🛠️ Tecnologias Relacionadas
* **MongoDB Atlas:** Hospedagem em nuvem.
* **Mongoose (Provável):** Sugerido pelos campos `createdAt`, `updatedAt` e `__v` presentes nos documentos.
