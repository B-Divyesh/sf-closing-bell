import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { WebSocketServer } from 'ws';
import { advance, cleanName, join, newRoom, snapshot, start, trade } from './game.mjs';

const port = Number(process.env.PORT || 8080);
const dataDir = process.env.DATA_DIR || '/data';
try { mkdirSync(dataDir, { recursive: true }); } catch { /* local fallback below */ }
let db;
try { db = new DatabaseSync(`${dataDir}/closing-bell.db`); } catch { db = new DatabaseSync('./closing-bell.db'); }
db.exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL)');
const clients = new Map();
const allowedOrigins = new Set(['https://closing-bell.sociobot.in', 'http://127.0.0.1:4173', 'http://localhost:4173']);
const buckets = new Map();

function rateOk(ip) { const now = Date.now(); const bucket = buckets.get(ip) || { n: 0, at: now }; if (now - bucket.at > 1000) { bucket.n = 0; bucket.at = now; } bucket.n += 1; buckets.set(ip, bucket); return bucket.n <= 20; }
function save(room) { room.updatedAt = Date.now(); db.prepare('INSERT INTO rooms(code,state,updated_at) VALUES(?,?,?) ON CONFLICT(code) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at').run(room.code, JSON.stringify(room), room.updatedAt); }
function get(code) { const row = db.prepare('SELECT state FROM rooms WHERE code=?').get(code); return row ? JSON.parse(row.state) : null; }
function code() { const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let value = ''; do { value = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join(''); } while (get(value)); return value; }
function send(ws, data) { if (ws.readyState === 1) ws.send(JSON.stringify(data)); }
function error(ws, message) { send(ws, { type: 'error', message }); }
function broadcast(room) { save(room); for (const [ws, client] of clients) if (client.code === room.code) send(ws, snapshot(room, client.token)); }

const server = createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify({ ok: true, build: process.env.BUILD_SHA || 'dev' })); return; }
  res.writeHead(404, { 'content-type': 'application/json' }); res.end('{"error":"not found"}');
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
server.on('upgrade', (req, socket, head) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  if (!allowedOrigins.has(req.headers.origin || '') || !rateOk(ip)) { socket.write('HTTP/1.1 429 Too Many Requests\r\nRetry-After: 1\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => { ws.ip = ip; wss.emit('connection', ws); });
});
wss.on('connection', ws => {
  ws.on('message', raw => {
    if (!rateOk(ws.ip)) return error(ws, 'Too many messages. Try again in a second.');
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return error(ws, 'Message is not valid JSON.'); }
    const name = cleanName(msg.name);
    if (msg.type === 'create') { const token = crypto.randomUUID(); const room = newRoom(code(), token, name); clients.set(ws, { code: room.code, token }); broadcast(room); return; }
    const room = typeof msg.code === 'string' ? get(msg.code.toUpperCase()) : null;
    if (!room) return error(ws, 'Room code not found. Check the five characters and try again.');
    if (msg.type === 'join') { const token = crypto.randomUUID(); const result = join(room, token, name); if (!result.ok) return error(ws, result.error); clients.set(ws, { code: room.code, token }); broadcast(room); return; }
    if (msg.type === 'reconnect') { const player = room.players.find(p => p.id === msg.token); if (!player) return error(ws, 'This saved seat is no longer available. Join the room again.'); player.connected = true; clients.set(ws, { code: room.code, token: msg.token }); broadcast(room); return; }
    const client = clients.get(ws); if (!client || client.code !== room.code || client.token !== msg.token) return error(ws, 'Your seat is not authorised for this room.');
    let result = msg.type === 'start' ? (room.hostId === client.token ? start(room) : { ok: false, error: 'Only the host can open the market.' }) : msg.type === 'trade' ? trade(room, client.token, msg.goodId, msg.side) : { ok: false, error: 'Unknown action.' };
    if (!result.ok) return error(ws, result.error); broadcast(room);
  });
  ws.on('close', () => { const client = clients.get(ws); clients.delete(ws); if (!client) return; const room = get(client.code); const player = room?.players.find(p => p.id === client.token); if (player) { player.connected = false; broadcast(room); } });
});
setInterval(() => { const rows = db.prepare("SELECT state FROM rooms WHERE updated_at > ?").all(Date.now() - 24 * 60 * 60 * 1000); rows.forEach(row => { const room = JSON.parse(row.state); if (room.phase === 'playing') { advance(room); broadcast(room); } }); }, 1000).unref();
server.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ event: 'listening', port, storage: db.filename || 'local' })));
