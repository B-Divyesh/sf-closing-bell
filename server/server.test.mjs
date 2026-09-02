import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const port = 8183;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const open = () => new Promise((resolve, reject) => {
  const ws = new WebSocket('ws://127.0.0.1:' + port, { headers: { origin: 'http://127.0.0.1:4173' } });
  ws.once('open', () => resolve(ws)); ws.once('error', reject);
});
const message = ws => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('WebSocket state timeout')), 3000);
  ws.once('message', body => { clearTimeout(timer); resolve(JSON.parse(body.toString())); });
});

test('@claim:online-authority three browser seats receive only server-checked room state', async () => {
  const data = await mkdtemp(join(tmpdir(), 'closing-bell-'));
  const service = spawn(process.execPath, ['server/server.mjs'], { env: { ...process.env, PORT: String(port), DATA_DIR: data }, stdio: 'ignore' });
  await wait(300);
  const a = await open(), b = await open(), c = await open();
  try {
    a.send(JSON.stringify({ type: 'create', name: 'A' }));
    let state = await message(a); const code = state.room.code;
    const token = state.room.players.find(player => player.isYou).id;
    b.send(JSON.stringify({ type: 'join', code, name: 'B' })); await Promise.all([message(a), message(b)]);
    c.send(JSON.stringify({ type: 'join', code, name: 'C' })); await Promise.all([message(a), message(b), message(c)]);
    a.send(JSON.stringify({ type: 'start', code, token })); state = await message(a);
    assert.equal(state.room.phase, 'playing');
    a.send(JSON.stringify({ type: 'trade', code, token, goodId: 'citrus', side: 'buy' }));
    state = await message(a);
    assert.equal(state.room.players.find(player => player.isYou).holdings[0], 1);
    a.close();
    const reloaded = await open();
    reloaded.send(JSON.stringify({ type: 'reconnect', code, token }));
    state = await message(reloaded);
    assert.equal(state.room.players.find(player => player.isYou).holdings[0], 1);
    reloaded.close();
  } finally {
    [a, b, c].forEach(ws => ws.close()); service.kill(); await rm(data, { recursive: true, force: true });
  }
});
