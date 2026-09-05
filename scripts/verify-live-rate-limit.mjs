import WebSocket from 'ws';

const realtimeUrl = process.env.REALTIME_URL || 'wss://closing-bell-realtime.sociobot.in';
const productOrigin = process.env.PRODUCT_ORIGIN || 'https://closing-bell.sociobot.in';
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function openOnce() {
  return new Promise(resolve => {
    const socket = new WebSocket(realtimeUrl, { headers:{origin:productOrigin} });
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    socket.once('open', () => { socket.close(); finish({opened:true}); });
    socket.once('unexpected-response', (_, response) => finish({
      opened:false,
      status:response.statusCode,
      retryAfter:response.headers['retry-after']
    }));
    socket.once('error', error => finish({opened:false,error:error.message}));
  });
}

async function connectedMessageLimit() {
  const socket = new WebSocket(realtimeUrl, { headers:{origin:productOrigin} });
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  const limited = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No connected-client 429 response.')), 5_000);
    socket.on('message', body => {
      const value = JSON.parse(body.toString());
      if (value.status === 429) { clearTimeout(timer); resolve(value); }
    });
    for (let index = 0; index < 21; index += 1) socket.send(JSON.stringify({type:'unknown'}));
  });
  socket.close();
  return limited;
}

const upgrades = await Promise.all(Array.from({length:21}, openOnce));
const upgradeLimit = upgrades.find(result => result.status === 429);
if (!upgradeLimit || upgradeLimit.retryAfter !== '1') {
  throw new Error(`Expected HTTP 429 with Retry-After: 1, received ${JSON.stringify(upgrades)}.`);
}
await wait(1_100);
const messageLimit = await connectedMessageLimit();
if (messageLimit.retryAfter !== 1) throw new Error(`Expected in-band retryAfter 1, received ${JSON.stringify(messageLimit)}.`);

console.log(JSON.stringify({
  realtimeUrl,
  upgradeAttempts:upgrades.length,
  openedUpgrades:upgrades.filter(result => result.opened).length,
  upgradeLimit:{status:upgradeLimit.status,retryAfter:upgradeLimit.retryAfter},
  messageLimit
}, null, 2));
