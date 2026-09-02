import WebSocket from 'ws';

const url = 'wss://closing-bell-realtime.sociobot.in';
const origin = 'https://closing-bell.sociobot.in';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const connect = () => new Promise((resolve, reject) => {
  const socket = new WebSocket(url, { headers: { origin } });
  socket.once('open', () => resolve(socket));
  socket.once('error', reject);
});
const next = (socket, predicate = () => true, timeout = 5000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => { socket.off('message', onMessage); reject(new Error('Timed out waiting for WebSocket message')); }, timeout);
  const onMessage = body => {
    const value = JSON.parse(body.toString());
    if (!predicate(value)) return;
    clearTimeout(timer);
    socket.off('message', onMessage);
    resolve(value);
  };
  socket.on('message', onMessage);
});
const send = (socket, value, predicate) => {
  const pending = next(socket, predicate);
  socket.send(JSON.stringify(value));
  return pending;
};

const result = {};
const sockets = await Promise.all(Array.from({ length: 9 }, () => connect()));
try {
  let state = await send(sockets[0], { type: 'create', name: 'Boundary host' }, value => value.type === 'state');
  const code = state.room.code;
  const tokens = [state.room.players.find(player => player.isYou).id];
  for (let index = 1; index < 8; index += 1) {
    state = await send(sockets[index], { type: 'join', code, name: `Seat ${index + 1}` }, value => value.type === 'state');
    tokens.push(state.room.players.find(player => player.isYou).id);
  }
  const ninth = await send(sockets[8], { type: 'join', code, name: 'Seat 9' }, value => value.type === 'error');
  assert(ninth.message === 'This room already has eight players.', `Unexpected ninth-seat result: ${ninth.message}`);
  state = await send(sockets[0], { type: 'start', code, token: tokens[0] }, value => value.type === 'state' && value.room.phase === 'playing');
  assert(state.room.total === 360 && state.room.seconds === 360, 'Eight-seat room did not start a 360-second round');
  const opening = state.room.goods[0].price;
  const hostFinal = next(sockets[0], value => value.type === 'state' && value.room.goods[0].price === opening + 4);
  const guestFinal = next(sockets[1], value => value.type === 'state' && value.room.goods[0].price === opening + 4);
  sockets[0].send(JSON.stringify({ type: 'trade', code, token: tokens[0], goodId: 'citrus', side: 'buy' }));
  sockets[1].send(JSON.stringify({ type: 'trade', code, token: tokens[1], goodId: 'citrus', side: 'buy' }));
  const [hostAfter, guestAfter] = await Promise.all([hostFinal, guestFinal]);
  assert(hostAfter.room.players.find(player => player.isYou).holdings[0] === 1, 'Host concurrent holding was not authoritative');
  assert(guestAfter.room.players.find(player => player.isYou).holdings[0] === 1, 'Guest concurrent holding was not authoritative');
  const tamper = await send(sockets[2], { type: 'trade', code, token: tokens[0], goodId: 'citrus', side: 'buy' }, value => value.type === 'error');
  assert(tamper.message === 'Your seat is not authorised for this room.', 'Forged seat token was not rejected');
  result.room = {
    code,
    acceptedSeats: 8,
    ninthSeatError: ninth.message,
    roundSeconds: state.room.total,
    concurrentOpeningPrice: opening,
    concurrentFinalPrice: hostAfter.room.goods[0].price,
    hostHolding: hostAfter.room.players.find(player => player.isYou).holdings[0],
    guestHolding: guestAfter.room.players.find(player => player.isYou).holdings[0],
    tamperError: tamper.message
  };
} finally {
  sockets.forEach(socket => socket.close());
}

await new Promise(resolve => setTimeout(resolve, 1200));
const upgrades = await Promise.all(Array.from({ length: 21 }, () => new Promise(resolve => {
  const socket = new WebSocket(url, { headers: { origin } });
  socket.once('open', () => { socket.close(); resolve({ status: 101 }); });
  socket.once('unexpected-response', (_, response) => {
    resolve({ status: response.statusCode, retryAfter: response.headers['retry-after'] });
    response.destroy();
  });
  socket.once('error', error => resolve({ status: 0, error: error.message }));
})));
result.rateLimit = {
  allowancePerWindow: upgrades.filter(item => item.status === 101).length,
  rejected: upgrades.filter(item => item.status === 429),
  allStatuses: upgrades.map(item => item.status)
};
assert(result.rateLimit.allowancePerWindow === 20, `Observed ${result.rateLimit.allowancePerWindow} accepted upgrades instead of 20`);
assert(result.rateLimit.rejected.length === 1 && result.rateLimit.rejected[0].retryAfter === '1', 'The over-limit upgrade lacked HTTP 429 and Retry-After: 1');

console.log(JSON.stringify(result, null, 2));
