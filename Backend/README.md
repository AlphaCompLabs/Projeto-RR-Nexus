<div align="center">
    <img src="../logo_readme_2.png" alt="RR Nexus - Sessões Contínuas" style="max-width: 100%;">

<br>

<i>Projeto de arquitetura de aplicação distribuída (3 camadas) que utiliza Round Robin DNS para balanceamento de carga. O desafio central é a implementação de uma sessão centralizada para garantir a persistência do login do usuário entre múltiplos servidores , superando a natureza 'stateless' do balanceamento DNS.</i>
</div><br>

# 🚀 Backend

**Autores:** Caio Silveira e Diogo Freitas

Este é o servidor backend para o projeto **RR Nexus**. Sua principal responsabilidade é fornecer uma API RESTful para autenticação e gerenciamento de uma **sessão centralizada** em MongoDB, resolvendo o desafio de persistência de estado em uma arquitetura com balanceamento de carga DNS Round Robin (RR DNS).

Este servidor é a "camada de lógica" e a "camada de dados", atendendo às requisições dos 3 servidores HTTP (Frontend).

## ✨ Funcionalidades (Features)

* **Autenticação de Usuário:** Endpoint `POST /login` seguro com `bcryptjs` para comparação de hash.
* **Registro de Usuário:** Endpoint `POST /register` com hashing automático de senha (hook `pre-save` do Mongoose).
* **Gestão de Sessão Centralizada:** Criação de sessões no MongoDB no login e invalidação no logout.
* **Validação de Sessão (Token):** Endpoint `GET /session/validate` (protegido) que o frontend usa para verificar se o usuário continua logado.
* **Redefinição de Senha:** Endpoint `POST /reset-password` para redefinição de senha (escopo do trabalho).
* **Arquitetura Profissional:** O código é separado em `Models`, `Routes` e `Controllers` para manutenibilidade.
* **Segurança:** Configuração de CORS (`Whitelist`) e Handler Global de Erros para prevenir crashes.

## 💻 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Arquitetura:** RESTful
* **Banco de Dados:** MongoDB (com Mongoose ODM)
* **Testes:** Jest & Supertest
* **Segurança:** `bcryptjs` (hashing), `crypto` (tokens), `cors`
* **Ambiente:** `dotenv` (gestão de variáveis de ambiente)

---

## 🔧 Instalação e Configuração

**1. Clonar o Repositório:**
```bash
git clone https://github.com/AlphaCompLabs/Projeto-RR-Nexus.git
```

**2. Navegar para a Pasta:**
```bash
cd Projeto-RR-Nexus/Backend
```

**3. Instalar Dependências:**
```bash
npm install
```

**4. Configurar Variáveis de Ambiente: Crie um arquivo ``.env`` na raiz da pasta ``Backend/``. Este arquivo é obrigatório para conectar ao banco de dados.:**
```bash
# .env (Exemplo)

# Porta onde o servidor vai rodar
PORT=3000

# Connection String do  cluster MongoDB
MONGO_CONNECTION_STRING="mongodb+srv://backendDiogo:ugEMdOkX1q6PhFVp@netvisionbd.vzphu9o.mongodb.net/granada"
```

## 🏃 Como Rodar

#### **Modo de Desenvolvimento**
Inicia o servidor com ``nodemon``, que reinicia automaticamente a cada alteração de código.
```bash
npm run dev
```
O servidor estará disponível em ``http://localhost:3000``.

#### **Rodar os Testes**
Executa a suíte de testes unitários e de integração com o Jest.
```bash
npm test
```
**Importante**: Verifique se o seu servidor (``npm run dev``) **NÃO** está rodando. O Jest/Supertest vão iniciar o servidor por conta própria. (Se ele estiver rodando, você terá um erro de "Porta já em uso").

## 🗺️ API Endpoints (Contrato da API)
Todos os endpoints estão prefixados com ``/api/auth``.

```
Método	Rota	                   Protegido?	Descrição
GET	    /	                       ❌ Não	    Health check. Retorna se a API está online.
POST	/api/auth/register	       ❌ Não	    Registra um novo usuário.
POST	/api/auth/login	           ❌ Não	    Autentica um usuário e retorna um sessionId.
GET	    /api/auth/session/validate ✅ Sim	    (Endpoint Principal) Valida um sessionId.
POST	/api/auth/logout	       ✅ Sim	    Invalida (deleta) um sessionId do banco.
POST	/api/auth/reset-password   ❌ Não	    Redefine a senha de um usuário.
```