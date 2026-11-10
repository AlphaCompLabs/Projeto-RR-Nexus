/*
 * =====================================================================================
 * Projeto RR-Nexus
 * Versão: 1.0.0
 * Autor(es): Gustavo Martins Gripaldi (demo estática)
 * Data: 2026-11-10
 * Descrição: API de demonstração. Espelha no navegador as rotas Express de
 * Backend/routes/auth.js + Backend/controllers/authController.js (mesmos status, DTOs e
 * mensagens) e o endpoint /lb-ping do Nginx (Network/README.md), que devolve o servidor
 * HTTP da vez no header X-Server-Name. As coleções `usuarios` e `sessoes` viram um JSON
 * no localStorage. Pura e sem imports: roda no interceptor e no Node (scripts/demo-api.test.mts).
 * Divergências do backend real estão marcadas com "demo fix" ou "demo extension".
 * =====================================================================================
 */

// --- SEÇÃO 1: CONTRATO ---
export interface Store { load(): string | null; save(value: string): void; }
export interface Reply { status: number; body: unknown; headers?: Record<string, string>; }

interface User { _id: string; username: string; salt: string; hash: string; createdAt: string; updatedAt: string; }
interface Session { _id: string; sessionId: string; userId: string; expiresAt: string; createdAt: string; updatedAt: string; }
interface Db { v: 1; users: User[]; sessions: Session[]; rr: number; }

/** Conta do login de um clique. Senha pública de demonstração, não é credencial de verdade. */
export const DEMO_USER = 'visitante';
export const DEMO_PASSWORD = 'demo-rr-nexus';
/** Os três servidores HTTP do mapa de rede (Network/README.md). */
export const SERVERS = [
  { name: 'HTTP-01', addr: '172.19.50.21' },
  { name: 'HTTP-02', addr: '172.19.50.22' },
  { name: 'HTTP-03', addr: '172.19.50.23' },
];

const SESSION_TTL = 60 * 60 * 1000; // 1 hora, como no controller
const TTL_MONITOR = 60 * 1000; // o monitor TTL do MongoDB roda a cada 60 s
const MAX_FIELD = 128; // demo fix: o Express aceita qualquer tamanho

// --- SEÇÃO 2: HELPERS ---
const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const random = (n: number) => hex(crypto.getRandomValues(new Uint8Array(n)));
/** Formato de ObjectId: 4 bytes de timestamp + 8 aleatórios. */
const objectId = (now: number) => Math.floor(now / 1000).toString(16).padStart(8, '0') + random(8);
const iso = (t: number) => new Date(t).toISOString();
const json = (status: number, body: unknown): Reply => ({ status, body });
/** demo fix: campo que não é string (ou é enorme) conta como ausente (400); no Express viraria 500. */
const field = (v: unknown) => (typeof v === 'string' && v.length <= MAX_FIELD ? v : '');

/** Faz o papel do bcrypt do hook pre-save: PBKDF2-SHA256 com sal por usuário (WebCrypto). */
async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 }, key, 256);
  return hex(new Uint8Array(bits));
}

async function newUser(username: string, password: string, now: number): Promise<User> {
  const salt = random(16);
  return { _id: objectId(now), username, salt, hash: await hashPassword(password, salt), createdAt: iso(now), updatedAt: iso(now) };
}

/** Banco inicial: a conta demo e duas contas de senha desconhecida (servem para o 409 do cadastro). */
async function seed(now: number): Promise<Db> {
  const day = 86_400_000;
  return {
    v: 1, rr: 0, sessions: [],
    users: [
      await newUser(DEMO_USER, DEMO_PASSWORD, now - 20 * day),
      await newUser('admin', random(16), now - 30 * day),
      await newUser('professor', random(16), now - 25 * day),
    ],
  };
}

/** O localStorage é entrada hostil: qualquer formato inesperado recria o banco. */
function isDb(v: unknown): v is Db {
  const strs = (o: unknown, keys: string[]) =>
    !!o && typeof o === 'object' && keys.every((k) => typeof (o as Record<string, unknown>)[k] === 'string');
  const d = v as Record<string, unknown> | null;
  return !!d && d['v'] === 1 && Number.isInteger(d['rr']) && Array.isArray(d['users']) && Array.isArray(d['sessions'])
    && d['users'].every((u) => strs(u, ['_id', 'username', 'salt', 'hash', 'createdAt', 'updatedAt']))
    && d['sessions'].every((s) => strs(s, ['_id', 'sessionId', 'userId', 'expiresAt', 'createdAt', 'updatedAt']));
}

// --- SEÇÃO 3: ENTRADA ---
let queue: Promise<unknown> = Promise.resolve();

/**
 * Atende uma requisição. Uma por vez: as rotas fazem load, await (hash) e save, e duas
 * intercaladas perderiam a escrita uma da outra.
 */
export function handle(method: string, path: string, authorization: string | null, body: unknown, store: Store, now?: number): Promise<Reply> {
  const run = queue.then(() => route(method, path, authorization, body, store, now ?? Date.now()));
  queue = run.catch(() => undefined);
  return run;
}

async function route(method: string, path: string, authorization: string | null, body: unknown, store: Store, now: number): Promise<Reply> {
  let db: Db;
  try {
    const parsed = JSON.parse(store.load() ?? 'null');
    db = isDb(parsed) ? parsed : await seed(now);
  } catch {
    db = await seed(now);
  }
  // Índice TTL da coleção sessoes (expireAfterSeconds: 0): o MongoDB apaga as vencidas sozinho.
  db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) + TTL_MONITOR > now);
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const reply = await dispatch(db, `${method} ${path}`, authorization, b, now);
  store.save(JSON.stringify(db));
  return reply;
}

// --- SEÇÃO 4: ROTAS (Backend/routes/auth.js + Nginx /lb-ping) ---
async function dispatch(db: Db, route: string, authorization: string | null, b: Record<string, unknown>, now: number): Promise<Reply> {
  switch (route) {
    case 'POST /api/auth/login': return login(db, b, now);
    case 'POST /api/auth/register': return register(db, b, now);
    case 'POST /api/auth/reset-password': return resetPassword(db, b, now);
    case 'GET /api/auth/session/validate': return withSession(authorization, (id) => validate(db, id, now));
    case 'POST /api/auth/logout': return withSession(authorization, (id) => logout(db, id));
    case 'GET /lb-ping': {
      // DNS Round Robin: cada consulta cai no próximo servidor HTTP da lista.
      const server = SERVERS[db.rr % SERVERS.length];
      db.rr = (db.rr + 1) % SERVERS.length;
      return { status: 204, body: null, headers: { 'X-Server-Name': server.name, 'X-Server-Addr': server.addr, 'X-Server-Port': '80' } };
    }
    default: return json(404, { error: 'Rota não encontrada.' });
  }
}

/** extractSessionFromHeader */
function withSession(authorization: string | null, next: (sessionId: string) => Reply): Reply {
  if (!authorization || !authorization.startsWith('Bearer ')) return json(401, { error: 'Token de sessão não fornecido ou mal formatado.' });
  const sessionId = authorization.split(' ')[1];
  if (!sessionId) return json(401, { error: 'Token de sessão não fornecido.' });
  return next(sessionId);
}

async function login(db: Db, b: Record<string, unknown>, now: number): Promise<Reply> {
  const username = field(b['username']), password = field(b['password']);
  if (!username || !password) return json(400, { error: 'Usuário e senha são obrigatórios.' });
  const user = db.users.find((u) => u.username === username.toLowerCase());
  if (!user || (await hashPassword(password, user.salt)) !== user.hash) return json(401, { error: 'Credenciais inválidas.' });
  // Política de Sessão Única: o novo login invalida as sessões antigas do usuário.
  db.sessions = db.sessions.filter((s) => s.userId !== user._id);
  const session: Session = { _id: objectId(now), sessionId: random(32), userId: user._id, expiresAt: iso(now + SESSION_TTL), createdAt: iso(now), updatedAt: iso(now) };
  db.sessions.push(session);
  return json(200, { message: 'Login realizado com sucesso!', sessionId: session.sessionId, username: user.username });
}

function validate(db: Db, sessionId: string, now: number): Reply {
  const session = db.sessions.find((s) => s.sessionId === sessionId);
  if (!session) return json(401, { error: 'Sessão inválida ou não encontrada.' });
  const drop = () => { db.sessions = db.sessions.filter((s) => s !== session); };
  if (now > Date.parse(session.expiresAt)) {
    drop();
    return json(401, { error: 'Sessão expirada. Por favor, faça login novamente.' });
  }
  const user = db.users.find((u) => u._id === session.userId);
  if (!user) {
    drop();
    return json(401, { error: 'Usuário associado à sessão não existe mais.' });
  }
  return json(200, {
    message: 'Sessão validada com sucesso.',
    userId: user._id, username: user.username,
    loginTime: session.createdAt, sessionId: session.sessionId, expiresAt: session.expiresAt,
  });
}

function logout(db: Db, sessionId: string): Reply {
  const session = db.sessions.find((s) => s.sessionId === sessionId);
  if (!session) return json(200, { message: 'Sessão não encontrada ou já invalidada.' });
  db.sessions = db.sessions.filter((s) => s !== session);
  return json(200, { message: 'Logout realizado com sucesso. Sessão invalidada.' });
}

async function register(db: Db, b: Record<string, unknown>, now: number): Promise<Reply> {
  const username = field(b['username']), password = field(b['password']);
  if (!username || !password) return json(400, { error: 'Usuário e senha são obrigatórios.' });
  const name = username.trim().toLowerCase(); // schema: lowercase + trim
  if (!name) return json(500, { error: 'Erro interno do servidor.' }); // validação "required" do Mongoose cai no handler global
  if (db.users.some((u) => u.username === name)) return json(409, { error: 'Este nome de usuário já está em uso.' });
  db.users.push(await newUser(name, password, now));
  return json(201, { message: 'Usuário registrado com sucesso! (Senha hasheada)', username: name });
}

async function resetPassword(db: Db, b: Record<string, unknown>, now: number): Promise<Reply> {
  const username = field(b['username']), newPassword = field(b['newPassword']);
  if (!username || !newPassword) return json(400, { error: 'Nome de usuário e nova senha são obrigatórios.' });
  const user = db.users.find((u) => u.username === username.toLowerCase());
  if (!user) return json(404, { error: 'Usuário não encontrado.' });
  // demo extension: a conta demo fica fixa para o login de um clique continuar funcionando.
  if (user.username === DEMO_USER) return json(403, { error: 'A senha da conta de demonstração não pode ser alterada.' });
  user.salt = random(16);
  user.hash = await hashPassword(newPassword, user.salt);
  user.updatedAt = iso(now);
  return json(200, { message: 'Senha redefinida com sucesso.' });
}
