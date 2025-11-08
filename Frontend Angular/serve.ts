import * as express from 'express';
import * as path from 'path';
import * as os from 'os';
import * as cors from 'cors'; // Importe o CORS

const app = express();

// --- 1. CONFIGURAÇÃO ---

// Use o CORS para permitir que a app (na porta 80)
// fale com o seu backend (na porta 3000)
app.use(cors()); 

// O nome da pasta que o 'ng build' cria
const angularAppName = 'projeto-rr-nexus'; // (Verifique este nome!)
const PORT = 80; // Servidores HTTP rodam na porta 80

// --- 2. A API DO HOSTNAME (O que você queria!) ---
// O Angular vai chamar esta API para saber o nome do servidor
app.get('/api/server-info', (req, res) => {
  console.log(`[HTTP Server] Pedido recebido. A enviar hostname: ${os.hostname()}`);
  res.status(200).json({
    hostname: os.hostname()
  });
});

// --- 3. SERVIR OS FICHEIROS ESTÁTICOS DO ANGULAR ---
const staticFilesPath = path.join(__dirname, 'dist', angularAppName, 'browser');
app.use(express.static(staticFilesPath));

// --- 4. ROTA "CATCH-ALL" (para o Roteamento do Angular) ---
// Qualquer outro GET (ex: /meu-perfil) deve servir o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(staticFilesPath, 'index.html'));
});

// --- 5. INICIAR O SERVIDOR ---
app.listen(PORT, () => {
  console.log(`(Frontend) Servidor HTTP rodando na porta ${PORT}`);
  console.log(`(Frontend) Hostname: ${os.hostname()}`);
});