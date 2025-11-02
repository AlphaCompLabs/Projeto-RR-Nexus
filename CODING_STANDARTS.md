---

# 🤝 Contribuindo para o Projeto

Obrigado por colaborar! Este documento define as regras e boas práticas que **todas as equipes** devem seguir para garantir **qualidade, consistência e legibilidade** no código.

---

## ✅ Checklist antes de abrir um Pull Request (PR)

* [ ] Código segue os padrões de nomenclatura e estilo da equipe.
* [ ] Arquivo inicia com cabeçalho padronizado (`# Nome, versão, autores, descrição`).
* [ ] Imports organizados (padrão → externos → internos).
* [ ] Sem valores fixos (hardcoded) → usar variáveis de ambiente ou config.
* [ ] Funções e classes com **tipagem** e **docstrings/JSDoc**.
* [ ] **Logging** no lugar de `print()`.
* [ ] Nenhum `any` em TypeScript.
* [ ] Testes unitários atualizados e passando.
* [ ] CI/CD verde (pipelines executados com sucesso).

---

## 📂 Estrutura de Arquivo Recomendada

1. **Cabeçalho**

   ```
   # =====================================================================================
   # Projeto RR-Nexus
   # Versão: x.x.x
   # Autor(es): Nome(s) / Equipe
   # Data: YYYY-MM-DD
   # Descrição: Breve resumo do propósito deste arquivo.
   # =====================================================================================
   ```

2. **Importações**

   * Padrão do Python/JS → Externas → Locais

3. **Configurações Globais**

   * Logging, constantes, variáveis de ambiente

4. **Modelos de Dados**

   * Entrada (payloads, DTOs, requests)
   * Saída (responses, interfaces para frontend)

5. **Core / Lógica Principal**

   * Funções, classes, serviços, hooks

6. **Interfaces (Entrada/Saída)**

   * Backend: Endpoints
   * Frontend: Componentes principais
   * CLI: `parse_args()` ou equivalente
   * Scripts: Função `run()`

7. **Tratamento de Erros**

   * Sempre com `try/except` ou `try/catch` + logging

8. **Testes**

   * Unitários (cada equipe)
   * Integração/E2E (QA)

9. **Execução Direta (quando aplicável)**

   ```python
   if __name__ == "__main__":
       main()
   ```

---

## ✍️ Documentação e Comentários

* **README.md** em cada pasta principal (`backend/`, `frontend/`, etc.) com instruções de configuração, execução e testes.
* **Comentários**: explicar **o porquê** da lógica, não **o que** o código faz.
* **Docstrings / JSDoc** em funções e classes complexas (propósito, parâmetros, retorno).

---

## 📐 Padrões de Código

### Nomenclatura

| Convenção              | Uso Principal                     | Exemplo                       | Equipes           |
| ---------------------- | --------------------------------- | ----------------------------- | ----------------- |
| **camelCase**          | Variáveis/funções em JS/TS        | `fetchTrafficData()`          | Frontend          |
| **snake\_case**        | Variáveis/funções em Python       | `get_main_traffic_data()`     | Backend, DevOps   |
| **PascalCase**         | Classes, Interfaces, Componentes  | `TrafficPayload`, `LoginForm` | Backend, Frontend |
| **kebab-case**         | Nomes de arquivos (JS/TS, CSS)    | `traffic-chart.component.ts`  | Frontend          |
| **UPPER\_SNAKE\_CASE** | Constantes, variáveis de ambiente | `DATABASE_URL`, `MAX_CLIENTS` | Todas             |

---

### Backend (Python / FastAPI)

* Type hints obrigatórios (`List`, `Dict`, `Optional`).
* Logging configurado (sem `print()`).
* Modelos Pydantic separados para **ingestão** e **consumo**.
* Endpoints documentados (`tags`, `summary`, `description`, `status_code`, `response_model`).
* Tratamento de erros com `HTTPException` e logging detalhado.

---

### Frontend (TypeScript / Angular/React)

* Tipagem forte (`interface`, `type`, `Props`).
* Componentes pequenos, focados e reutilizáveis.
* Services centralizam chamadas HTTP.
* Variáveis de ambiente em `environment.ts` ou `.env`.

---

### UX/UI (HTML / Tailwind CSS)

* HTML semântico (`<header>`, `<main>`, `<section>`).
* Acessibilidade (A11y): `alt` em imagens, `aria-label` em ícones, suporte a teclado.
* Classes utilitárias do Tailwind no lugar de CSS customizado.

---

👉 Siga este guia sempre que contribuir.
Isso garante que o código se mantenha **organizado, padronizado e confiável** para toda a equipe.
