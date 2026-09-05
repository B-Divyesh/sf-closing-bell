import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import WebSocket from 'ws';

const port = 8183;
let dataDir;
let service;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return; } catch { /* service is starting */ }
    await wait(50);
  }
  throw new Error('Realtime service did not start');
}
async function restartService() {
  const previous = service;
  const exited = new Promise(resolve => previous.once('exit', resolve));
  previous.kill();
  await Promise.race([exited, wait(3_000)]);
  service = spawn(process.execPath, ['--experimental-sqlite', 'server/start.mjs'], {
    env:{...process.env,PORT:String(port),DATA_DIR:dataDir,BUILD_SHA:'test-build-c646a26',MESSAGE_RATE_LIMIT:'8'},
    stdio:'ignore'
  });
  await waitForHealth();
}
const open = (origin = 'http://127.0.0.1:4173') => new Promise((resolve, reject) => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}`, { headers:{origin} });
  socket.once('open', () => resolve(socket));
  socket.once('error', reject);
});
const message = socket => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('WebSocket state timeout')), 3000);
  socket.once('message', body => { clearTimeout(timer); resolve(JSON.parse(body.toString())); });
});

before(async () => {
  dataDir = await mkdtemp(join(tmpdir(), 'closing-bell-'));
  service = spawn(process.execPath, ['--experimental-sqlite', 'server/start.mjs'], {
    env:{...process.env,PORT:String(port),DATA_DIR:dataDir,BUILD_SHA:'test-build-c646a26',MESSAGE_RATE_LIMIT:'8'},
    stdio:'ignore'
  });
  await waitForHealth();
});

after(async () => {
  service?.kill();
  if (dataDir) await rm(dataDir,{recursive:true,force:true});
});

test('health exposes the running build SHA', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{ok:true,service:'closing-bell-realtime',build:'test-build-c646a26'});
  assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status,200);
});

test('the WebSocket origin policy rejects an untrusted site with 403', async () => {
  const status = await new Promise((resolve,reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`,{headers:{origin:'https://attacker.example'}});
    socket.once('unexpected-response',(_,response) => resolve(response.statusCode));
    socket.once('open',() => reject(new Error('Untrusted origin opened a socket')));
    socket.once('error',() => {});
  });
  assert.equal(status,403);
});

test('connected-message limiting reports 429 and Retry-After before closing', async () => {
  const socket = await open();
  try {
    const closed = new Promise(resolve => socket.once('close',(code,reason) => resolve({code,reason:reason.toString()})));
    const rateMessage = new Promise((resolve,reject) => {
      const timer = setTimeout(() => reject(new Error('No rate-limit response')),3000);
      socket.on('message',body => {
        const value = JSON.parse(body.toString());
        if (value.status === 429) { clearTimeout(timer); resolve(value); }
      });
    });
    for (let index = 0; index < 9; index += 1) socket.send('{"type":"unknown"}');
    const value = await rateMessage;
    assert.equal(value.status,429);
    assert.equal(value.retryAfter,1);
    assert.match(value.message,/one second/);
    const close = await closed;
    assert.equal(close.code,1013);
    assert.match(close.reason,/429.*Retry-After=1/);
  } finally { socket.close(); }
});

test('@claim:online-authority three browser seats share server-checked price impact and recover after reload', async () => {
  const a = await open(), b = await open(), c = await open();
  try {
    let pending = message(a);
    a.send(JSON.stringify({type:'create',name:'A'}));
    let state = await pending;
    const code = state.room.code;
    const token = state.room.players.find(player => player.isYou).id;

    let messages = [message(a),message(b)];
    b.send(JSON.stringify({type:'join',code,name:'B'}));
    await Promise.all(messages);
    messages = [message(a),message(b),message(c)];
    c.send(JSON.stringify({type:'join',code,name:'C'}));
    await Promise.all(messages);

    pending = message(a);
    a.send(JSON.stringify({type:'start',code,token}));
    state = await pending;
    assert.equal(state.room.phase,'playing');
    const opening = state.room.goods[0].price;

    pending = message(a);
    a.send(JSON.stringify({type:'trade',code,token,goodId:'citrus',side:'buy'}));
    state = await pending;
    assert.equal(state.room.players.find(player => player.isYou).holdings[0],1);
    assert.equal(state.room.goods[0].price,opening + 2);

    a.close();
    await wait(50);
    const reloaded = await open();
    pending = message(reloaded);
    reloaded.send(JSON.stringify({type:'reconnect',code,token}));
    state = await pending;
    assert.equal(state.room.players.find(player => player.isYou).holdings[0],1);
    reloaded.close();
  } finally { [a,b,c].forEach(socket => socket.close()); }
});

test('room codes isolate one room from another room\'s seat token', async () => {
  const a = await open(), b = await open();
  try {
    let pending = message(a);
    a.send(JSON.stringify({type:'create',name:'First'}));
    const first = await pending;
    const firstCode = first.room.code;
    const firstToken = first.room.players.find(player => player.isYou).id;

    pending = message(b);
    b.send(JSON.stringify({type:'create',name:'Second'}));
    const second = await pending;
    const secondCode = second.room.code;
    const secondPrice = second.room.goods[0].price;

    pending = message(a);
    a.send(JSON.stringify({type:'trade',code:secondCode,token:firstToken,goodId:'citrus',side:'buy'}));
    const rejected = await pending;
    assert.equal(rejected.type,'error');
    assert.match(rejected.message,/not authorised/);

    pending = message(b);
    b.send(JSON.stringify({type:'reconnect',code:secondCode,token:second.room.players.find(player => player.isYou).id}));
    const secondAfter = await pending;
    assert.equal(secondAfter.room.code,secondCode);
    assert.equal(secondAfter.room.goods[0].price,secondPrice);
    assert.notEqual(firstCode,secondCode);
  } finally { a.close(); b.close(); }
});

test('SQLite room state survives an authoritative process restart', async () => {
  const a = await open(), b = await open(), c = await open();
  let reloaded;
  try {
    let pending = message(a);
    a.send(JSON.stringify({type:'create',name:'A'}));
    let state = await pending;
    const code = state.room.code;
    const token = state.room.players.find(player => player.isYou).id;

    let messages = [message(a),message(b)];
    b.send(JSON.stringify({type:'join',code,name:'B'}));
    await Promise.all(messages);
    messages = [message(a),message(b),message(c)];
    c.send(JSON.stringify({type:'join',code,name:'C'}));
    await Promise.all(messages);
    pending = message(a);
    a.send(JSON.stringify({type:'start',code,token}));
    await pending;
    pending = message(a);
    a.send(JSON.stringify({type:'trade',code,token,goodId:'citrus',side:'buy'}));
    state = await pending;
    assert.equal(state.room.players.find(player => player.isYou).holdings[0],1);

    a.close(); b.close(); c.close();
    await restartService();
    reloaded = await open();
    pending = message(reloaded);
    reloaded.send(JSON.stringify({type:'reconnect',code,token}));
    state = await pending;
    assert.equal(state.room.phase,'playing');
    assert.equal(state.room.players.find(player => player.isYou).holdings[0],1);
  } finally { reloaded?.close(); a.close(); b.close(); c.close(); }
});
