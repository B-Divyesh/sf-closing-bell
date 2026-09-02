export const GOODS = [
  { id: 'citrus', name: 'Glowfruit', mark: 'GF', color: 'lime', price: 38 },
  { id: 'vane', name: 'Weather vane', mark: 'WV', color: 'plum', price: 51 },
  { id: 'robot', name: 'Tin robot', mark: 'TR', color: 'blue', price: 44 }
];

export const HEADLINES = [
  ['A lighthouse keeper orders Glowfruit lantern oil.', [8, -3, 1]],
  ['A gusty parade needs weather vanes.', [-2, 9, 0]],
  ['The school fair wants tiny robot ushers.', [0, -2, 10]],
  ['A rain shower spoils one Glowfruit crate.', [-8, 2, -1]],
  ['The bell maker buys polished weather vanes.', [1, 8, -2]],
  ['A toy museum opens a robot repair desk.', [0, 0, 9]]
];

export function newRoom(code, hostId, hostName, now = Date.now()) {
  const seed = seedFrom(code, now);
  return {
    code, hostId, phase: 'lobby', createdAt: now, updatedAt: now, seed,
    seconds: 360, total: 360, headlineIndex: -1, headline: 'Invite two to seven friends, then open the market.',
    goods: GOODS.map(g => ({ ...g, start: g.price })),
    players: [{ id: hostId, name: cleanName(hostName), cash: 180, holdings: [0, 0, 0], connected: true, objective: seed % 3, objectiveMet: null, finalCash: null }]
  };
}

export function cleanName(value) {
  const name = String(value || '').replace(/[^\w -]/g, '').trim().slice(0, 14);
  return name || 'Trader';
}

export function join(room, id, name) {
  if (room.phase !== 'lobby') return { ok: false, error: 'This market has already started.' };
  if (room.players.length >= 8) return { ok: false, error: 'This room already has eight players.' };
  room.players.push({ id, name: cleanName(name), cash: 180, holdings: [0, 0, 0], connected: true, objective: (room.seed + room.players.length) % 3, objectiveMet: null, finalCash: null });
  return { ok: true };
}

export function start(room) {
  if (room.phase !== 'lobby') return { ok: false, error: 'The market is already open.' };
  if (room.players.length < 3) return { ok: false, error: 'Three players are needed to open the market.' };
  openRound(room);
  return { ok: true };
}

export function restart(room, playerId) {
  if (room.phase !== 'finished') return { ok: false, error: 'The current market has not finished.' };
  if (room.hostId !== playerId) return { ok: false, error: 'Only the host can start the next market.' };
  room.seed = nextSeed(room.seed);
  room.goods = GOODS.map(g => ({ ...g, start: g.price }));
  room.seconds = room.total;
  room.players.forEach((player, index) => {
    player.cash = 180;
    player.holdings = [0, 0, 0];
    player.objective = (room.seed + index) % 3;
    player.objectiveMet = null;
    player.finalCash = null;
  });
  openRound(room);
  return { ok: true };
}

export function trade(room, playerId, goodId, side) {
  if (room.phase !== 'playing') return { ok: false, error: 'Trades open when the host starts the market.' };
  const player = room.players.find(p => p.id === playerId);
  const index = room.goods.findIndex(g => g.id === goodId);
  if (!player || index < 0 || !['buy', 'sell'].includes(side)) return { ok: false, error: 'That trade is not valid.' };
  const price = room.goods[index].price;
  if (side === 'buy') {
    if (player.cash < price) return { ok: false, error: 'Not enough tickets. Sell a holding first.' };
    player.cash -= price; player.holdings[index] += 1;
    room.goods[index].price += 2;
  } else {
    if (!player.holdings[index]) return { ok: false, error: `You do not hold ${room.goods[index].name} yet.` };
    player.cash += price; player.holdings[index] -= 1;
    room.goods[index].price = Math.max(8, room.goods[index].price - 2);
  }
  return { ok: true, status: `${player.name} ${side === 'buy' ? 'bought' : 'sold'} one ${room.goods[index].name} for ${price} tickets.` };
}

export function advance(room, seconds = 1) {
  if (room.phase !== 'playing') return;
  for (let i = 0; i < seconds && room.phase === 'playing'; i += 1) {
    room.seconds -= 1;
    const elapsed = room.total - room.seconds;
    if (elapsed > 0 && elapsed % 45 === 0) {
      room.headlineIndex = (room.headlineIndex + 1) % HEADLINES.length;
      room.headline = HEADLINES[room.headlineIndex][0];
      changePrices(room, HEADLINES[room.headlineIndex][1], room.seconds <= 90 ? 1.75 : 1);
    }
    if (room.seconds > 0 && elapsed % 3 === 0) drift(room);
    if (room.seconds <= 0) finish(room);
  }
}

export function snapshot(room, token) {
  const mine = room.players.find(p => p.id === token);
  const objective = mine ? ['Finish with two Glowfruit.', 'Finish with two weather vanes.', 'Finish with two tin robots.'][mine.objective] : '';
  return {
    type: 'state', room: {
      code: room.code, hostId: room.hostId, phase: room.phase, seconds: room.seconds, total: room.total,
      headline: room.headline, goods: room.goods, players: room.players.map(p => ({ ...p, isYou: p.id === token })),
      objective,
      outcome: mine?.objectiveMet == null ? null : {
        won: mine.objectiveMet,
        finalCash: mine.finalCash,
        objective
      }
    }
  };
}

function openRound(room) {
  room.phase = 'playing';
  room.headlineIndex = room.seed % HEADLINES.length;
  room.headline = HEADLINES[room.headlineIndex][0];
  changePrices(room, HEADLINES[room.headlineIndex][1], 1);
}

function seedFrom(code, now) {
  let seed = Number(now) >>> 0;
  for (const char of String(code)) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  return seed || 1;
}

function nextSeed(seed) { return (Math.imul(seed, 1664525) + 1013904223) >>> 0; }
function changePrices(room, moves, multiplier) { room.goods.forEach((g, i) => { g.price = Math.max(8, Math.round(g.price + moves[i] * multiplier)); }); }
function drift(room) { room.seed = nextSeed(room.seed); room.goods.forEach((g, i) => { const n = ((room.seed >>> (i * 7)) % 7) - 3; g.price = Math.max(8, g.price + n); }); }
function finish(room) {
  room.phase = 'finished'; room.headline = 'The bell rang. Holdings were liquidated.';
  room.players.forEach(p => {
    p.objectiveMet = p.holdings[p.objective] >= 2;
    p.cash += p.holdings.reduce((sum, count, i) => sum + count * room.goods[i].price, 0);
    p.finalCash = p.cash;
    p.holdings = [0, 0, 0];
  });
}
