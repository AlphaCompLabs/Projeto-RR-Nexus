// Contract test of the in-browser API (npm run test:demo). Same status codes and messages as Backend/controllers/authController.js.
import assert from 'node:assert/strict';
import { DEMO_PASSWORD, DEMO_USER, handle, type Reply } from '../src/app/demo/demo-api.ts';

let saved: string | null = null;
const store = { load: () => saved, save: (v: string) => { saved = v; } };
let clock = Date.parse('2026-11-10T12:00:00Z');
const call = (method: string, path: string, body?: unknown, token?: string): Promise<Reply> =>
  handle(method, path, token === undefined ? null : `Bearer ${token}`, body, store, clock);
const err = (r: Reply) => (r.body as { error: string }).error;
const ok = <T>(r: Reply) => r.body as T;

// Login
assert.equal(err(await call('POST', '/api/auth/login', {})), 'Usuário e senha são obrigatórios.');
assert.equal((await call('POST', '/api/auth/login', { username: 42, password: ['x'] })).status, 400); // hostile types
assert.equal(err(await call('POST', '/api/auth/login', { username: 'ninguem', password: 'x' })), 'Credenciais inválidas.');
assert.equal((await call('POST', '/api/auth/login', { username: DEMO_USER, password: 'errada' })).status, 401);
const first = await call('POST', '/api/auth/login', { username: DEMO_USER.toUpperCase(), password: DEMO_PASSWORD });
assert.equal(first.status, 200);
const { sessionId: s1, username } = ok<{ sessionId: string; username: string }>(first);
assert.equal(username, DEMO_USER);
assert.match(s1, /^[0-9a-f]{64}$/);

// Validate
assert.equal(err(await handle('GET', '/api/auth/session/validate', null, null, store, clock)), 'Token de sessão não fornecido ou mal formatado.');
assert.equal(err(await handle('GET', '/api/auth/session/validate', 'Bearer ', null, store, clock)), 'Token de sessão não fornecido.');
assert.equal(err(await call('GET', '/api/auth/session/validate', null, 'nope')), 'Sessão inválida ou não encontrada.');
const v = ok<{ username: string; userId: string; sessionId: string; loginTime: string }>(await call('GET', '/api/auth/session/validate', null, s1));
assert.equal(v.username, DEMO_USER);
assert.equal(v.sessionId, s1);
assert.match(v.userId, /^[0-9a-f]{24}$/);
assert.equal(v.loginTime, new Date(clock).toISOString());

// Single session policy: a second login invalidates the first token
const s2 = ok<{ sessionId: string }>(await call('POST', '/api/auth/login', { username: DEMO_USER, password: DEMO_PASSWORD })).sessionId;
assert.equal((await call('GET', '/api/auth/session/validate', null, s1)).status, 401);
assert.equal((await call('GET', '/api/auth/session/validate', null, s2)).status, 200);

// Expiry (1 h) and the TTL index cleanup
clock += 60 * 60 * 1000 + 1000;
assert.equal(err(await call('GET', '/api/auth/session/validate', null, s2)), 'Sessão expirada. Por favor, faça login novamente.');
const s3 = ok<{ sessionId: string }>(await call('POST', '/api/auth/login', { username: DEMO_USER, password: DEMO_PASSWORD })).sessionId;
clock += 2 * 60 * 60 * 1000;
assert.equal(err(await call('GET', '/api/auth/session/validate', null, s3)), 'Sessão inválida ou não encontrada.');

// Logout is idempotent
const s4 = ok<{ sessionId: string }>(await call('POST', '/api/auth/login', { username: DEMO_USER, password: DEMO_PASSWORD })).sessionId;
assert.equal(ok<{ message: string }>(await call('POST', '/api/auth/logout', {}, s4)).message, 'Logout realizado com sucesso. Sessão invalidada.');
assert.equal(ok<{ message: string }>(await call('POST', '/api/auth/logout', {}, s4)).message, 'Sessão não encontrada ou já invalidada.');
assert.equal((await call('GET', '/api/auth/session/validate', null, s4)).status, 401);

// Register
assert.equal((await call('POST', '/api/auth/register', { username: 'x' })).status, 400);
assert.equal(err(await call('POST', '/api/auth/register', { username: 'Admin', password: 'segredo1' })), 'Este nome de usuário já está em uso.');
const reg = await call('POST', '/api/auth/register', { username: '  Nova.Conta ', password: 'segredo1' });
assert.equal(reg.status, 201);
assert.equal(ok<{ username: string }>(reg).username, 'nova.conta');
assert.equal((await call('POST', '/api/auth/register', { username: 'a'.repeat(500), password: 'segredo1' })).status, 400);
assert.equal((await call('POST', '/api/auth/login', { username: 'nova.conta', password: 'segredo1' })).status, 200);
assert.ok(!saved!.includes('segredo1'), 'password must be stored hashed');

// Reset password
assert.equal(err(await call('POST', '/api/auth/reset-password', { username: 'nova.conta' })), 'Nome de usuário e nova senha são obrigatórios.');
assert.equal(err(await call('POST', '/api/auth/reset-password', { username: 'fantasma', newPassword: 'x' })), 'Usuário não encontrado.');
assert.equal((await call('POST', '/api/auth/reset-password', { username: DEMO_USER, newPassword: 'x' })).status, 403);
assert.equal((await call('POST', '/api/auth/reset-password', { username: 'nova.conta', newPassword: 'outra22' })).status, 200);
assert.equal((await call('POST', '/api/auth/login', { username: 'nova.conta', password: 'segredo1' })).status, 401);
assert.equal((await call('POST', '/api/auth/login', { username: 'nova.conta', password: 'outra22' })).status, 200);

// DNS Round Robin on /lb-ping, persisted across "reloads"
const names: string[] = [];
for (let i = 0; i < 4; i++) {
  const r = await call('GET', '/lb-ping');
  assert.equal(r.status, 204);
  names.push(r.headers!['X-Server-Name']);
}
assert.deepEqual(names, ['HTTP-01', 'HTTP-02', 'HTTP-03', 'HTTP-01']);

// Concurrent requests are serialized (no lost writes)
// (login awaits the hash between load and save; unserialized, it would write back a stale rotation counter)
await Promise.all([call('POST', '/api/auth/login', { username: DEMO_USER, password: DEMO_PASSWORD }), call('GET', '/lb-ping'), call('GET', '/lb-ping')]);
assert.equal((await call('GET', '/lb-ping')).headers!['X-Server-Name'], 'HTTP-01');

// Unknown route, corrupted storage reseeds
assert.equal((await call('GET', '/api/auth/nada')).status, 404);
saved = '{"v":1,"users":[{"username":1}],"sessions":[],"rr":0}';
assert.equal((await call('POST', '/api/auth/login', { username: 'nova.conta', password: 'outra22' })).status, 401);
assert.equal((await call('POST', '/api/auth/login', { username: DEMO_USER, password: DEMO_PASSWORD })).status, 200);

console.log('demo-api: all contract checks passed');
