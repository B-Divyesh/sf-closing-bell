import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { WebSocketServer } from 'ws';
import { advance, cleanName, join, newRoom, restart, snapshot, start, trade } from './game.mjs';

// A single durable SQLite writer owns each room service revision and its room state.
const port = Number(process.env.PORT || 8080);
const dataDir = process.env.DATA_DIR || '/data';
try { mkdirSync(dataDir, { recursive: true }); } catch { /* local fallback below */ }
let db;
try { db = new DatabaseSync(`file:${dataDir}/closing-bell-rooms-v3.db?nolock=1`); } catch { db = new DatabaseSync('./closing-bell-rooms-v3.db'); }
db.exec('PRAGMA busy_timeout = 5000');
const hasRooms = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='rooms'").get();
if (!hasRooms) db.exec('CREATE TABLE rooms (code TEXT PRIMARY KEY, state TEXT NOT NULL, updated_at INTEGER NOT NULL)');
const clients = new Map();
const defaultOrigins = process.env.NODE_ENV === 'production'
  ? 'https://closing-bell.sociobot.in'
  : 'https://closing-bell.sociobot.in,http://127.0.0.1:4173,http://localhost:4173';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || defaultOrigins).split(',').map(value => value.trim()).filter(Boolean));
const upgradeBuckets = new Map();
const messageBuckets = new Map();
const messageLimit = Number(process.env.MESSAGE_RATE_LIMIT || 20);
const testRoundSeconds = Number(process.env.ROUND_SECONDS || 0);

function rateOk(buckets, key, limit) { const now = Date.now(); const bucket = buckets.get(key) || { n: 0, at: now }; if (now - bucket.at >= 1000) { bucket.n = 0; bucket.at = now; } bucket.n += 1; buckets.set(key, bucket); return bucket.n <= limit; }
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
function rejectUpgrade(socket, status, reason, retryAfter) {
  const retry = retryAfter ? `Retry-After: ${retryAfter}\r\n` : '';
  socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\n${retry}Content-Length: 0\r\n\r\n`);
  socket.destroy();
}
server.on('upgrade', (req, socket, head) => {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim();
  if (!allowedOrigins.has(req.headers.origin || '')) return rejectUpgrade(socket, 403, 'Forbidden');
  if (!rateOk(upgradeBuckets, ip, 20)) return rejectUpgrade(socket, 429, 'Too Many Requests', 1);
  wss.handleUpgrade(req, socket, head, ws => { ws.ip = ip; ws.rateKey = `${ip}:${crypto.randomUUID()}`; wss.emit('connection', ws); });
});
wss.on('connection', ws => {
  ws.on('message', raw => {
    if (!rateOk(messageBuckets, ws.rateKey, messageLimit)) {
      send(ws, { type: 'error', status: 429, message: 'Too many messages. Try again in one second.', retryAfter: 1 });
      ws.close(1013, '429 Too Many Messages; Retry-After=1');
      return;
    }
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return error(ws, 'Message is not valid JSON.'); }
    const name = cleanName(msg.name);
    if (msg.type === 'create') { const token = crypto.randomUUID(); const room = newRoom(code(), token, name); if (testRoundSeconds > 0) { room.seconds = testRoundSeconds; room.total = testRoundSeconds; } clients.set(ws, { code: room.code, token }); broadcast(room); return; }
    const room = typeof msg.code === 'string' ? get(msg.code.toUpperCase()) : null;
    if (!room) return error(ws, 'Room code not found. Check the five characters and try again.');
    if (msg.type === 'join') { const token = crypto.randomUUID(); const result = join(room, token, name); if (!result.ok) return error(ws, result.error); clients.set(ws, { code: room.code, token }); broadcast(room); return; }
    if (msg.type === 'reconnect') { const player = room.players.find(p => p.id === msg.token); if (!player) return error(ws, 'This saved seat is no longer available. Join the room again.'); player.connected = true; clients.set(ws, { code: room.code, token: msg.token }); broadcast(room); return; }
    const client = clients.get(ws); if (!client || client.code !== room.code || client.token !== msg.token) return error(ws, 'Your seat is not authorised for this room.');
    let result = msg.type === 'start' ? (room.hostId === client.token ? start(room) : { ok: false, error: 'Only the host can open the market.' }) : msg.type === 'restart' ? restart(room, client.token) : msg.type === 'trade' ? trade(room, client.token, msg.goodId, msg.side) : { ok: false, error: 'Unknown action.' };
    if (!result.ok) return error(ws, result.error); broadcast(room);
  });
  ws.on('close', () => { messageBuckets.delete(ws.rateKey); const client = clients.get(ws); clients.delete(ws); if (!client) return; const room = get(client.code); const player = room?.players.find(p => p.id === client.token); if (player) { player.connected = false; broadcast(room); } });
});
setInterval(() => { const rows = db.prepare("SELECT state FROM rooms WHERE updated_at > ?").all(Date.now() - 24 * 60 * 60 * 1000); rows.forEach(row => { const room = JSON.parse(row.state); if (room.phase === 'playing') { advance(room); broadcast(room); } }); }, 1000).unref();
server.listen(port, '0.0.0.0', () => console.log(JSON.stringify({ event: 'listening', port, storage: db.filename || 'local' })));
