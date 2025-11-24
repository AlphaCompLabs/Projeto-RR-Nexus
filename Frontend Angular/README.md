<div align="center">
    <img src="../logo_readme_2.png" alt="RR Nexus - Sessões Contínuas" style="max-width: 100%;">

<br>

<i>Projeto de arquitetura de aplicação distribuída (3 camadas) que utiliza Round Robin DNS para balanceamento de carga. O desafio central é a implementação de uma sessão centralizada para garantir a persistência do login do usuário entre múltiplos servidores , superando a natureza 'stateless' do balanceamento DNS.</i>
</div><br>

# 🎨 Frontend

**Autora:** Elisa Nunes

Este é o cliente web (SPA) do projeto RR Nexus, desenvolvido em Angular. Ele representa a camada de apresentação distribuída em 3 servidores HTTP, acessados via DNS Round Robin.

O Frontend é responsável pela interação com o usuário, validação visual de segurança e comunicação com a API centralizada para manter a sessão ativa, mesmo que o usuário troque de servidor físico durante a navegação.

## 💎 Funcionalidades

- **Autenticação Completa:** Telas de Login, Cadastro e Recuperação de Senha integradas à API.
- **Proteção de Rotas (Guards):** Implementação de AuthGuard robusto que previne acessos não autorizados e resolve condições de corrida (Race Conditions) ao recarregar a página (F5).
- **Interatividade Visual:** Componentes dinâmicos (MiddleComponent) que demonstram as camadas da arquitetura (Rede, DB, Back, Front) com efeitos de rolagem.
- **Gestão de Sessão no Cliente:** Armazenamento seguro de tokens e validação automática de sessão ao iniciar a aplicação (APP_INITIALIZER logic).
- **Feedback de Servidor:** Identificação visual de qual servidor HTTP (Hostname) está respondendo à requisição via headers do Nginx.
- **Design Responsivo:** Estilização moderna e adaptativa utilizando Tailwind CSS.

## 🛠️ Ferramentas Utilizadas

- **Framework:** Angular 18+ (Standalone Components)  
- **Linguagem:** TypeScript  
- **Estilização:** Tailwind CSS  
- **Gerenciamento de Estado:** RxJS (BehaviorSubjects)  
- **Testes:** Jasmine & Karma  
- **Integração:** HTTP Client  

## ⚙️ Instalação e Configuração

### 1. Clonar o Repositório

```bash
git clone https://github.com/AlphaCompLabs/Projeto-RR-Nexus.git
```

### 2. Acessar a Branch de Desenvolvimento

```bash
git checkout dev
```

### 3. Navegar para a Pasta do Frontend

```bash
cd "Projeto-RR-Nexus/Frontend Angular"
```

### 4. Instalar Dependências

```bash
npm install
```

## 🕹️ Como Rodar (Ambiente das VMs)

Para este projeto, optamos por rodar a aplicação em modo de desenvolvimento (`ng serve`) nas máquinas virtuais para facilitar depuração e Live Reload.

Para iniciar o servidor acessível externamente:

```bash
ng serve
```

No contexto do projeto (DNS Round Robin), o acesso final será feito via domínio (ex: `www.meutrabalho.com.br`) que balanceará entre as instâncias rodando este frontend.

## 🧪 Testes Unitários (Relatórios)

Este projeto possui cobertura robusta de testes (100% Coverage), garantindo a integridade de Services, Guards e Componentes.

### Executando os Testes

Criamos um script personalizado:

```bash
npm run test:relatorio
```

### Onde ver o resultado?

Após a execução, verifique a pasta `coverage/`:

- **projeto-rr-nexus/index.html** — Site interativo para visualizar cobertura linha por linha  

Além disso, o arquivo segue disponível na raiz do frontend: **TESTE_UNITARIO.md** — Resumo em Markdown  

### Estratégia de Testes

- **Services:** Mock do HttpClient simulando sucesso/401/500  
- **Components:** Testes de DOM, botões, inputs, interações  
- **Guards:** Simulação de Observables garantindo espera da API  

## 📂 Estrutura do Projeto

```
src/app/
├── components/      # Componentes visuais reutilizáveis (Header, Footer, Sidebar...)
├── guards/          # Lógica de proteção de rotas (AuthGuard)
├── pages/           # Componentes de página completa (Login, Profile)
├── services/        # Lógica de negócios e comunicação HTTP (AuthService)
└── app.ts           # Componente Raiz (Gerencia o Splash Screen)
```
