import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, join, newRoom, restart, snapshot, start, trade } from './game.mjs';

function playingRoom() {
  const room = newRoom('ABCDE', 'host', 'Host', 1_700_000_000_000);
  join(room, 'two', 'Two');
  join(room, 'three', 'Three');
  assert.equal(start(room).ok, true);
  return room;
}

test('@claim:six-minute-round shared rooms run for six minutes with three to eight seats', () => {
  const room = newRoom('ABCDE', 'host', 'Host');
  assert.equal(room.total, 360);
  assert.equal(start(room).ok, false);
  for (let index = 2; index <= 8; index += 1) assert.equal(join(room, String(index), `Seat ${index}`).ok, true);
  assert.equal(room.players.length, 8);
  assert.equal(join(room, 'nine', 'Nine').ok, false);
  assert.equal(start(room).ok, true);
});

test('authoritative trades reject invalid balances and move the shared price', () => {
  const room = playingRoom();
  assert.equal(trade(room, 'host', 'citrus', 'sell').ok, false);
  const opening = room.goods[0].price;
  assert.equal(trade(room, 'host', 'citrus', 'buy').ok, true);
  assert.equal(room.goods[0].price, opening + 2);
  room.players[0].cash = 0;
  assert.equal(trade(room, 'host', 'citrus', 'buy').ok, false);
});

test('the bell evaluates the private goal and the host can restart a clean round', () => {
  const room = playingRoom();
  const player = room.players[0];
  player.holdings[player.objective] = 2;
  room.seconds = 1;
  advance(room);
  const report = snapshot(room, 'host').room;
  assert.equal(report.phase, 'finished');
  assert.equal(report.outcome.won, true);
  assert.deepEqual(player.holdings, [0, 0, 0]);
  assert.equal(restart(room, 'two').ok, false);
  assert.equal(restart(room, 'host').ok, true);
  assert.equal(room.phase, 'playing');
  assert.equal(player.cash, 180);
  assert.deepEqual(player.holdings, [0, 0, 0]);
  assert.equal(player.objectiveMet, null);
});

test('persisted room state recovers the same seat after a reload', () => {
  const room = playingRoom();
  assert.equal(trade(room, 'host', 'citrus', 'buy').ok, true);
  const recovered = JSON.parse(JSON.stringify(room));
  const state = snapshot(recovered, 'host').room;
  assert.equal(state.players.find(player => player.isYou)?.holdings[0], 1);
  assert.equal(state.phase, 'playing');
});
