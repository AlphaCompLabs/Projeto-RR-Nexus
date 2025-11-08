// (Frontend) server.ts - Corrigido

// --- 1. IMPORTAÇÕES ---
// (Usando o formato 'require' que o TypeScript/Node.js prefere)
import express from 'express'; 
import path from 'path';
import os from 'os';
import cors from 'cors';
import { Request, Response } from 'express';

// --- 2. CONFIGURAÇÃO ---
const app = express();
// [CORREÇÃO 1] O Servidor Frontend (HTTP) deve rodar na porta 80.
const PORT = 4200; 

// O nome da sua pasta de 'build' do Angular (ex: dist/projeto-rr-nexus/browser)
// Verifique seu 'angular.json' para ter certeza do caminho 'outputPath'
const angularBuildPath = path.join(__dirname, 'dist', 'projeto-rr-nexus', 'browser');

// --- 3. MIDDLEWARES ---

// [IMPORTANTE] Habilita o CORS.
// Isso permite que o Angular (rodando no navegador)
// possa chamar a si mesmo (para /api/server-info) e
// também o nosso Backend (em outro IP/porta) sem erros.
app.use(cors());

// Serve os arquivos estáticos (CSS, JS) do Angular
app.use(express.static(angularBuildPath));

// --- 4. ROTAS DA API ---

// [SEM ERROS] Esta rota está perfeita.
// O Angular chama esta API para saber o nome do servidor.
app.get('/api/server-info', (req: Request, res: Response) => {
  console.log(`[HTTP Server] Pedido recebido. A enviar hostname: ${os.hostname()}`);
  res.status(200).json({
    hostname: os.hostname()
  });
});

// --- 5. ROTA "CATCH-ALL" (para o Roteamento do Angular) ---

// [CORREÇÃO 2] Qualquer outra rota (ex: /login, /meu-perfil)
// deve servir o 'index.html', não 'app.html'.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(angularBuildPath, 'index.html'));
});

// --- 6. INICIAR O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`(Frontend) Servidor HTTP rodando na porta ${PORT}`);
  console.log(`(Frontend) Hostname: ${os.hostname()}`);
});