# CLAUDE.md, RR Nexus

> **Spec viva.** Porta de entrada lida pelo agente em toda sessão. Não duplica o [README.md](README.md), **aponta** pra ele. Atualize quando uma regra, comando, módulo ou armadilha mudar.
>
> **Última revisão:** 2026-11-10
> **Detalhes de arquitetura, simulação, stack real, equipe e itens conhecidos:** [README.md](README.md) e os READMEs de `Backend/`, `Database/`, `Network/`, `Frontend Angular/`

---

## 1. O que é

Projeto de equipe da **AlphaCompLabs** (Redes de Computadores, IESB 2025): aplicação web em 3 camadas com **DNS Round Robin** entre 3 servidores HTTP e **sessão centralizada** no MongoDB, para o login sobreviver à troca de servidor. Equipe: Elisa Nunes de Freitas (frontend), Diogo Freitas e Caio Silveira (backend), Gustavo Martins Gripaldi (banco), Mayron Malaquias e Pedro Borges (redes). Ao vivo: https://alphacomplabs.github.io/Projeto-RR-Nexus/ como **demo estática** de portfólio ([página no portfólio](https://g2portfolio.grovicdata.com/projetos/rr-nexus/)): o frontend original com um interceptor que responde o backend no navegador. O backend real continua intacto em `Backend/`. Estado anterior à demo: tag local `v1-pre-demo`. Branches antigas: tags `archive/*` (não mexer).

## 2. Stack + Comandos

Angular 20.3 standalone (zone.js, RxJS `BehaviorSubject`), Tailwind 3 (`tailwind.config.js`, paleta `nexus-*`), fontes Inter + Baseet em WOFF (subset latino). Demo: configuração `demo` do `angular.json` (`define DEMO_API`, `baseHref /Projeto-RR-Nexus/`, pré-render só da `/` com `@angular/ssr`, `outputMode: "static"`, sem hidratação). Backend: Node + Express 5 + Mongoose 8 + bcryptjs, Jest/Supertest. Rede: BIND9 + Nginx (`Network/README.md`). Node 22.18+ para os scripts `.mts`.

```bash
cd "Frontend Angular"
npm start            # ng serve, stack REAL (backend nas VMs). Não mudou.
npm run start:demo   # ng serve -c demo: API simulada, http://localhost:4200/Projeto-RR-Nexus/
npm test             # Karma/Jasmine da equipe (86 specs)
npm run test:demo    # scripts/demo-api.test.mts: contrato da API simulada vs authController
npm run build:pages  # test:demo + ng build -c production,demo + pages.mts (docs/) + check.mts
npm run check        # SEO, shells noindex, base path, sem /assets absoluto, sem URI de banco, zero travessão longo
cd ../Backend && npm run dev   # backend real (precisa de Backend/.env)
```

## 3. Mapa de módulos

| Caminho | Responsabilidade |
|---|---|
| `Frontend Angular/src/app/demo/demo-api.ts` | Espelho das rotas Express (`Backend/routes/auth.js` + `controllers/authController.js`) e do `/lb-ping` do Nginx (rodízio HTTP-01/02/03). Banco no `localStorage`, fila que serializa as requisições, PBKDF2 no lugar do bcrypt. **Pura, sem imports** (o teste roda no Node). |
| `Frontend Angular/src/app/demo/demo.ts` | Flag `DEMO`, `demoInterceptor` (com atraso de 300 ms), textos da faixa e link do portfólio. |
| `Frontend Angular/src/app/services/auth.service.ts` | Código da equipe: URLs fixas das VMs, token no `localStorage`. Só ganhou o guard de `localStorage` para o pré-render. |
| `Frontend Angular/src/app/{components,pages,guards}/` | Telas originais (header, middle, login-form, footer, profile-form, sidebar). Ajustes: responsivo, a11y, WebP, créditos, botões da demo. |
| `Frontend Angular/src/main.server.ts` | Entrada do pré-render (rotas: `''` Prerender, `**` Client). Só no build `demo`. |
| `Frontend Angular/src/app/shared/trailing-slash.ts` | `UrlSerializer` com barra final (cópia do G2Portfolio, inclui o fix do `parse`). |
| `Frontend Angular/scripts/` | `pages.mts` (dist para `docs/`, `.nojekyll`, `404.html`, shell `meu-perfil/`, preload das fontes), `check.mts`, `demo-api.test.mts`. |
| `Frontend Angular/public/` | `robots.txt`, `sitemap.xml`, `og.png` (1200x630), `favicon.ico`. |
| `Backend/` | API real. Não editar para a demo; mudou regra lá, muda `demo-api.ts` e o teste. |
| `docs/` | Saída do build publicada (GitHub Pages, `main:/docs`). Nunca editar à mão. |

## 4. Regras SEMPRE-ATIVAS

- **Preservar o design da equipe.** Paleta `nexus-*`, Baseet/Inter, gradientes, decorações e layout ficam como estão; mexer só no que está quebrado ou fraco (responsivo, contraste, desempenho). Nada de redesign.
- **Stack real intocada.** `npm start`/`ng build` sem `-c demo` não podem passar pelo interceptor nem pelo pré-render. Toda lógica da demo fica atrás de `DEMO`.
- **Contrato igual ao Express.** Status, campos e mensagens de `demo-api.ts` seguem o `authController`. Divergência só deliberada, marcada "demo fix"/"demo extension" no código e listada no README.
- **Demo honesta:** faixa "Demo estática para portfólio: dados simulados no navegador." com link do portfólio (home e sidebar do perfil), aviso para não usar senha real no cadastro, nenhuma credencial real.
- **Créditos da equipe** no footer (por camada, como nos READMEs dos módulos) e no JSON-LD (`creator`: Gustavo como Person `https://g2portfolio.grovicdata.com/#person`, demais por nome).
- **Pré-render só da `/`.** API de browser só com guard (`typeof localStorage/IntersectionObserver`), em eventos ou em rotas client. `/meu-perfil/` é client + `noindex`; recarregar responde 200.
- **Caminhos relativos a `<base href>`** (`assets/...`, nunca `/assets/...`); o `check` falha se aparecer.
- **Links internos com barra final** (serializer) e links do portfólio também.
- **Zero travessão longo (U+2014)** em texto visível, README e CLAUDE.md; o `check` falha.
- **Animação:** só `motion-safe:` (pulse, scroll suave); o fade da seção "Camadas" acompanha a rolagem.
- **`npm run build:pages` verde** antes de publicar.

## 5. Segurança

- Segredos só no `Backend/.env` (ignorado: `.gitignore` da raiz e do backend). Nunca ler, copiar, ecoar ou commitar. O README do backend usa placeholder `<usuario>:<senha>`.
- O site publicado não fala com servidor nenhum (o `check` falha se uma URI `mongodb://` entrar no build). O `localStorage` guarda só dados da demo; senhas com hash PBKDF2 + sal.
- `demo-api.ts` trata corpo e `localStorage` como hostis: tipos e tamanhos validados, banco inválido é recriado.
- Fraqueza conhecida do backend real: `reset-password` sem autenticação (README, "Itens conhecidos").

## 6. Common Hurdles

- **Git Bash converte `--base-href /Projeto-RR-Nexus/`** num caminho do Windows: use a configuração `demo` (ou `MSYS_NO_PATHCONV=1`).
- **Node 22 `cpSync` sai com 127 em silêncio** no caminho com "Programação": `pages.mts` usa `cp` de `fs/promises`.
- **EBUSY** ao recriar `docs/` se um shell ou servidor estiver com cwd dentro dela.
- **Python com caminho não-ASCII via argv** chega corrompido: scripts de QA rodam com cwd no repo e caminho relativo (`.shots/`).
- **`npm i @angular/ssr` dá ERESOLVE** (o npm tenta subir o router): instalado com `--legacy-peer-deps` nas versões exatas do core/CLI; o lock resultante passa em `npm ci` normal.
- **`TrailingSlashSerializer` muda `event.url` para `/meu-perfil/`:** o `App` compara com `startsWith`.
- **SVGs do Canva eram PNG embutido** (2 MB cada): viraram WebP a 2x do tamanho exibido; originais na tag `v1-pre-demo`. O logo tem variante 720w (`srcset`) porque o celular com DPR 1.75 pedia mais que 600w.
- **Inter variável com `font-weight: normal`:** só o peso 400 é usado (o negrito é sintetizado), então a fonte foi instanciada em 400; não declarar faixa de pesos sem conferir o visual.
- **Kaspersky injeta script** até no Chromium do Playwright: Lighthouse com `--remote-debugging-port=450x` + `npx lighthouse@12 --port=450x --blocked-url-patterns="*kaspersky-labs.com*"`; o pedido bloqueado ainda derruba `is-on-https` (boas práticas 81-82 local).
