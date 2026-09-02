import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, join, newRoom, snapshot, start, trade } from './game.mjs';

test('authoritative room rejects trades before three players and invalid balances', () => {
  const room = newRoom('ABCDE', 'host', 'Host');
  assert.deepEqual(start(room), { ok: false, error: 'Three players are needed to open the market.' });
  assert.equal(join(room, 'two', 'Two').ok, true); assert.equal(join(room, 'three', 'Three').ok, true);
  assert.equal(start(room).ok, true);
  assert.equal(trade(room, 'host', 'citrus', 'sell').ok, false);
  room.players[0].cash = 0;
  assert.equal(trade(room, 'host', 'citrus', 'buy').ok, false);
});

test('deterministic room reaches the bell and liquidates every holding', () => {
  const room = newRoom('ABCDE', 'host', 'Host'); join(room, 'two', 'Two'); join(room, 'three', 'Three'); start(room);
  room.players[0].holdings = [2, 0, 0]; room.seconds = 1; advance(room);
  assert.equal(room.phase, 'finished'); assert.deepEqual(room.players[0].holdings, [0, 0, 0]); assert.ok(room.players[0].cash > 180);
});

test('persisted room state recovers the same seat after a reload', () => {
  const room = newRoom('ABCDE', 'host', 'Host'); join(room, 'two', 'Two'); join(room, 'three', 'Three'); start(room);
  assert.equal(trade(room, 'host', 'citrus', 'buy').ok, true);
  const recovered = JSON.parse(JSON.stringify(room));
  const state = snapshot(recovered, 'host').room;
  assert.equal(state.players.find(player => player.isYou)?.holdings[0], 1);
  assert.equal(state.phase, 'playing');
});
