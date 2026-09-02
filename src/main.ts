import './style.css';

declare const __BUILD_SHA__: string;

type Good = { id:string; name:string; mark:string; color:string; price:number; start:number; holding:number };
type Outcome = { won:boolean; finalCash:number; objective:string };
type Game = { phase:'playing'|'finished'; cash:number; goods:Good[]; remainingMs:number; total:number; headline:number; nextNewsAt:number; status:string; mute:boolean; outcome:Outcome|null };
type Player = { id:string; name:string; cash:number; holdings:number[]; connected:boolean; isYou:boolean };
type Room = { code:string; hostId:string; phase:'lobby'|'playing'|'finished'; seconds:number; total:number; headline:string; goods:Omit<Good,'holding'>[]; players:Player[]; objective:string; outcome:Outcome|null };

const base = [
  { id:'citrus', name:'Glowfruit', mark:'GF', color:'lime', price:38 },
  { id:'vane', name:'Weather vane', mark:'WV', color:'plum', price:51 },
  { id:'robot', name:'Tin robot', mark:'TR', color:'blue', price:44 }
];
const news = [
  ['A lighthouse keeper orders Glowfruit lantern oil.', [8,-3,1]],
  ['A gusty parade needs weather vanes.', [-2,9,0]],
  ['The school fair wants tiny robot ushers.', [0,-2,10]],
  ['A rain shower spoils one Glowfruit crate.', [-8,2,-1]]
] as const;
const app = document.querySelector<HTMLDivElement>('#app')!;
const demoStateKey = 'demo:closing-bell:run';
const roomKey = 'closing-bell:room';
const fixedStep = 1000 / 60;
let game:Game|null = null;
let room:Room|null = null;
let ws:WebSocket|null = null;
let last = 0;
let accumulator = 0;
let lastPaintedSecond = -1;
let error = '';
let focusRoute = false;
let previousRoomPhase:Room['phase']|null = null;
let audioContext:AudioContext|null = null;

const isDemo = () => location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
const time = (seconds:number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, Math.ceil(seconds % 60))).padStart(2,'0')}`;
const demoDuration = () => {
  const value = Number(new URLSearchParams(location.search).get('duration'));
  return Number.isFinite(value) && value > 0 ? Math.min(value, 90) : 90;
};
const nav = () => '<header class="site-header"><a class="wordmark" href="/" data-route>Closing <span>Bell</span></a><nav aria-label="Primary"><a href="/" data-route>Rooms</a><a href="/demo" data-route>Demo</a><a href="/privacy" data-route>Privacy</a></nav></header>';
const foot = () => `<footer><p>Closing Bell is a fictional-goods game for short group breaks.</p><p class="footer-links"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><span>Built by Param Factory</span><span>Build ${__BUILD_SHA__}</span></p><p class="generated">Market-floor art is AI-generated and original to this game.</p></footer>`;
const announcer = () => '<div class="route-note" role="status" aria-live="polite"></div><div class="route-announcer sr-only" aria-live="polite"></div>';
const progress = (seconds:number,total:number) => `<progress class="progress" aria-label="${time(seconds)} remaining" value="${seconds}" max="${total}">${time(seconds)}</progress>`;

function clearDemo() {
  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith('demo:closing-bell:')) sessionStorage.removeItem(key);
  }
  game = null;
}

function navigate(path:string) {
  if (isDemo() && !path.startsWith('/demo')) clearDemo();
  history.pushState({}, '', path);
  room = null;
  if (ws) ws.close();
  ws = null;
  focusRoute = true;
  route();
}

function wireLinks() {
  app.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(link => {
    link.onclick = event => {
      event.preventDefault();
      navigate(link.getAttribute('href')!);
    };
  });
}

function finishRoute(title:string) {
  wireLinks();
  if (focusRoute) {
    focusRoute = false;
    requestAnimationFrame(() => {
      const heading = app.querySelector<HTMLElement>('h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
      const live = app.querySelector<HTMLElement>('.route-announcer');
      if (live) live.textContent = title;
    });
  }
}

function notice(message:string) {
  const node = app.querySelector<HTMLElement>('.route-note');
  if (node) node.textContent = message;
}

function newGame():Game {
  const total = demoDuration();
  const value:Game = {
    phase:'playing', cash:180,
    goods:base.map(good => ({...good, start:good.price, holding:0})),
    remainingMs:total * 1000, total, headline:-1, nextNewsAt:12,
    status:'The market is open. Make your first trade.', mute:false, outcome:null
  };
  headline(value);
  return value;
}

function saveDemo() {
  if (game) sessionStorage.setItem(demoStateKey, JSON.stringify(game));
}

function loadDemo():Game {
  try {
    const saved = JSON.parse(sessionStorage.getItem(demoStateKey) || 'null') as Game|null;
    if (saved && saved.total === demoDuration() && Array.isArray(saved.goods)) return saved;
  } catch { /* start a clean sample */ }
  const fresh = newGame();
  sessionStorage.setItem(demoStateKey, JSON.stringify(fresh));
  return fresh;
}

function route() {
  const path = location.pathname;
  const known = ['/', '/demo', '/privacy', '/terms', '/404'];
  if (!known.includes(path)) { page('/404'); return; }
  document.title = path === '/privacy' ? 'Privacy — Closing Bell' : path === '/terms' ? 'Terms — Closing Bell' : path === '/404' ? 'Page not found — Closing Bell' : isDemo() ? 'Demo — Closing Bell' : 'Closing Bell — Play a room-code market game';
  const canonicalPath = path === '/404' ? '/404' : isDemo() ? '/demo' : path;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', `https://closing-bell.sociobot.in${canonicalPath}`);
  if (path === '/privacy' || path === '/terms' || path === '/404') { page(path); return; }
  if (isDemo()) {
    if (!game) game = loadDemo();
    renderDemo();
    return;
  }
  game = null;
  renderRoom();
  restore();
}

function page(path:string) {
  const privacy = path === '/privacy';
  const terms = path === '/terms';
  const heading = privacy ? 'Keep game data under your control' : terms ? 'Play with fictional goods only' : 'This board is not open';
  const body = privacy
    ? '<p>Shared rooms store an anonymous seat token in this browser. The Closing Bell server stores room state and trades so players can reconnect.</p><p>The practice demo uses temporary session storage with keys beginning <code>demo:closing-bell</code>. Leaving demo mode removes those keys.</p><p>Closing Bell has no accounts, analytics, ads, or third-party services.</p>'
    : terms
      ? '<p>Closing Bell is free to play. It has no real assets, money, betting, prizes, or financial advice.</p><p>Use a name you are comfortable sharing with the other players in your room.</p>'
      : '<p>The page you requested does not exist.</p><p><a class="button" href="/" data-route>Return to the game</a></p>';
  app.innerHTML = `${nav()}<main id="main" class="copy-page"><article><h1>${heading}</h1>${body}</article></main>${foot()}${announcer()}`;
  finishRoute(heading);
}

function marketPreview() {
  return '<section class="market-preview" aria-label="Live preview of the practice market"><div class="preview-top"><div><span>Practice market</span><strong>Public headline</strong></div><b>1:30</b></div><p>A school fair wants tiny robot ushers.</p><ul><li><span><i class="swatch lime"></i>Glowfruit</span><strong>38</strong></li><li><span><i class="swatch plum"></i>Weather vane</span><strong>51</strong></li><li><span><i class="swatch blue"></i>Tin robot</span><strong>44</strong></li></ul><div class="preview-wallet"><span>Tickets <b>180</b></span><span>Goal <b>2 robots</b></span></div></section>';
}

function setupRoom() {
  return '<section class="room-setup" id="rooms"><div><p class="eyebrow">3–8 player room</p><h2>Create or join a room</h2><p>Share one five-letter code. The host opens the market after three players join.</p></div><form class="room-form"><label for="remote-name">Your seat name</label><input id="remote-name" name="name" maxlength="14" required value="Trader"><button class="button primary" name="intent" value="create">Create a room <span>→</span></button><label for="room-code">Join a room code</label><input id="room-code" name="code" maxlength="5" pattern="[A-Za-z0-9]{5}" aria-describedby="room-help"><button class="button" name="intent" value="join">Join this room</button><p id="room-help" class="connection" aria-live="polite">'+(error || 'Room state is checked by the game server.')+'</p></form></section>';
}

function landing() {
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">A short fictional-goods game</p><h1>Trade goods together before the bell</h1><p class="lede">For three to eight friends who want one six-minute market round.</p><div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data <span>→</span></a><span>Starts a private 90-second practice round.</span></div><ul class="facts"><li>No accounts</li><li>No real money</li><li>Free to play</li></ul></div>${marketPreview()}</section><section class="play-area">${setupRoom()}</section><section class="how"><h2>How the shared round works</h2><ol><li><b>Create a room.</b><span>Share the five-letter code with two to seven friends.</span></li><li><b>Read the market.</b><span>News and player trades move each price.</span></li><li><b>Meet your goal.</b><span>Hold the right goods when the bell rings.</span></li></ol></section><section class="limits"><h2>Fictional goods, real group decisions</h2><p>This is a social game. It does not use real money, prizes, betting, or financial advice.</p></section>`;
}

function card(g:Good|Omit<Good,'holding'>, index:number, held:number, shared=false) {
  const controls = shared
    ? room?.phase === 'playing'
      ? `<button data-remote="trade" data-side="sell" data-good="${g.id}" aria-label="Sell one ${g.name}">Sell</button><button data-remote="trade" data-side="buy" data-good="${g.id}" aria-label="Buy one ${g.name}">Buy</button>`
      : '<span>Trades open when the host starts.</span>'
    : `<button data-action="sell" data-good="${index}" aria-label="Sell one ${g.name}">Sell</button><button data-action="buy" data-good="${index}" aria-label="Buy one ${g.name}">Buy</button>`;
  return `<article class="good ${g.color}"><div class="good-title"><span class="good-mark">${g.mark}</span><div><h3>${g.name}</h3><p>Held: <b>${held}</b></p></div></div><p class="price">${g.price} <small>tickets</small></p><div class="trade">${controls}</div></article>`;
}

function portfolio(value:Game) {
  return value.cash + value.goods.reduce((sum, good) => sum + good.price * good.holding, 0);
}

function practiceBoard(value:Game) {
  const seconds = Math.ceil(value.remainingMs / 1000);
  return `<section class="game-shell" aria-label="Practice market game"><h1 class="screen-title">Trade the practice market</h1><div class="board-top"><div><p class="eyebrow">90-second practice</p><p class="status" aria-live="polite">${value.status}</p></div><div class="timer"><span>Time to bell</span><strong data-timer>${time(seconds)}</strong></div></div>${progress(seconds,value.total)}<div class="headline"><span aria-hidden="true">!</span><div><p class="eyebrow">Public headline</p><h2>${news[value.headline][0]}</h2></div></div><p class="rumor"><strong>Your goal:</strong> Finish holding at least two tin robots.</p><div class="goods">${value.goods.map((good,index) => card(good,index,good.holding)).join('')}</div><aside class="wallet"><div><span>Tickets</span><strong data-cash>${value.cash}</strong></div><div><span>Desk value</span><strong>${portfolio(value)}</strong></div><div><span>Holdings</span><strong>${value.goods.reduce((sum,good) => sum + good.holding,0)}</strong></div></aside><div class="game-controls"><button class="button quiet" data-action="pause">Pause</button><button class="button quiet" data-action="mute">Sound: ${value.mute?'off':'on'}</button></div></section>`;
}

function demoEnd(value:Game) {
  const outcome = value.outcome!;
  return `<section class="end-card ${outcome.won?'win':'loss'}"><p class="eyebrow">Closing report</p><h1>${outcome.won?'You met your goal':'The goal slipped away'}</h1><p>${outcome.won?'You held two tin robots when the bell rang.':'You needed two tin robots when the bell rang.'}</p><p>You finished with <strong>${outcome.finalCash} tickets</strong>.</p><button class="button primary" data-action="restart">Play another round <span>→</span></button></section>`;
}

function renderDemo() {
  const value = game!;
  app.innerHTML = `${nav()}<aside class="demo-banner" aria-label="Demo mode"><span>Demo — sample data, nothing is saved</span><button data-action="reset">Reset demo</button><button data-action="real">Start for real</button></aside><main id="main" class="demo-page"><section class="play-area">${value.phase === 'finished' ? demoEnd(value) : practiceBoard(value)}</section><section class="how"><h2>How this practice round works</h2><ol><li><b>Read the headline.</b><span>News changes the three market prices.</span></li><li><b>Buy and sell.</b><span>Your trades also move the selected price.</span></li><li><b>Beat the bell.</b><span>Hold two tin robots to win.</span></li></ol></section></main>${foot()}${announcer()}<dialog class="pause-dialog"><h2>Market paused</h2><p>Your current practice state stays in this tab.</p><button class="button primary" data-action="resume">Resume market</button></dialog>`;
  finishRoute(value.phase === 'finished' ? (value.outcome?.won ? 'You met your goal' : 'The goal slipped away') : 'Trade the practice market');
  app.querySelectorAll<HTMLElement>('[data-action]').forEach(element => element.onclick = () => action(element.dataset.action!, Number(element.dataset.good)));
}

function armAudio() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
}

function ringBell(muted:boolean) {
  if (muted || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.35);
  gain.gain.setValueAtTime(0.12, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.4);
}

function action(kind:string,index=0) {
  const value = game!;
  armAudio();
  if (kind === 'reset' || kind === 'restart') {
    clearDemo();
    game = newGame();
    saveDemo();
    last = performance.now();
    renderDemo();
    return;
  }
  if (kind === 'real') { clearDemo(); navigate('/'); return; }
  if (kind === 'mute') { value.mute = !value.mute; saveDemo(); renderDemo(); return; }
  if (kind === 'pause') { app.querySelector<HTMLDialogElement>('dialog')?.showModal(); return; }
  if (kind === 'resume') { app.querySelector<HTMLDialogElement>('dialog')?.close(); last = performance.now(); app.querySelector<HTMLElement>('[data-action="pause"]')?.focus(); return; }
  if (value.phase !== 'playing') return;
  const good = value.goods[index];
  if (kind === 'buy') {
    if (value.cash < good.price) { notice('Not enough tickets. Sell a holding first.'); return; }
    const paid = good.price;
    value.cash -= paid;
    good.holding += 1;
    good.price += 2;
    value.status = `Bought one ${good.name} for ${paid} tickets. Its market price rose.`;
  } else if (kind === 'sell') {
    if (!good.holding) { notice(`You do not hold ${good.name} yet. Buy one first.`); return; }
    const received = good.price;
    value.cash += received;
    good.holding -= 1;
    good.price = Math.max(8, good.price - 2);
    value.status = `Sold one ${good.name} for ${received} tickets. Its market price fell.`;
  }
  saveDemo();
  renderDemo();
}

function headline(value:Game) {
  value.headline = (value.headline + 1) % news.length;
  const item = news[value.headline];
  value.goods.forEach((good,index) => { good.price = Math.max(8,good.price + item[1][index]); });
  value.status = item[0];
}

function endDemo(value:Game) {
  const won = value.goods[2].holding >= 2;
  value.phase = 'finished';
  value.remainingMs = 0;
  value.outcome = { won, finalCash:portfolio(value), objective:'Finish holding at least two tin robots.' };
  saveDemo();
  ringBell(value.mute);
  renderDemo();
}

function remoteBoard(value:Room) {
  const me = value.players.find(player => player.isYou);
  const host = me?.id === value.hostId;
  const finished = value.phase === 'finished' && value.outcome;
  const controls = value.phase === 'lobby'
    ? host ? '<div class="game-controls"><button class="button primary" data-remote="start">Open the market</button></div>' : '<p>Only the host opens the market after three players join.</p>'
    : finished
      ? host ? '<div class="game-controls"><button class="button primary" data-remote="restart">Play another round</button></div>' : '<p>The host can start the next market.</p>'
      : '';
  return `<section class="game-shell" aria-label="Shared market game"><h1 class="screen-title">Trade the shared market</h1><div class="board-top"><div><p class="eyebrow">Room ${value.code} · ${value.players.length}/8 seats</p><p class="status" aria-live="polite">${value.phase === 'lobby'?'Waiting for three players. Share the room code.':value.headline}</p></div><div class="timer"><span>${value.phase === 'lobby'?'Room code':'Time to bell'}</span><strong>${value.phase === 'lobby'?value.code:time(value.seconds)}</strong></div></div>${value.phase === 'lobby'?'':progress(value.seconds,value.total)}${finished?`<section class="end-card ${finished.won?'win':'loss'}"><p class="eyebrow">Closing report</p><h2>${finished.won?'You met your goal':'The goal slipped away'}</h2><p>${finished.objective}</p><p>You finished with <strong>${finished.finalCash} tickets</strong>.</p>${controls}</section>`:`<div class="headline"><span aria-hidden="true">!</span><div><p class="eyebrow">${value.phase === 'lobby'?'Invite friends':'Public headline'}</p><h2>${value.phase === 'lobby'?`Share ${value.code}. The host opens the market at three players.`:value.headline}</h2></div></div><p class="rumor"><strong>Your goal:</strong> ${value.objective || 'Reconnect to your seat.'}</p><div class="goods">${value.goods.map((good,index) => card(good,index,me?.holdings[index] || 0,true)).join('')}</div><aside class="wallet"><div><span>Tickets</span><strong>${me?.cash ?? 0}</strong></div><div><span>Desk value</span><strong>${(me?.cash ?? 0) + value.goods.reduce((sum,good,index) => sum + good.price * (me?.holdings[index] || 0),0)}</strong></div><div><span>Holdings</span><strong>${me?.holdings.reduce((sum,count) => sum + count,0) ?? 0}</strong></div></aside>${controls}`}<section class="players"><h2>Players</h2><ul>${value.players.map(player => `<li>${player.name}${player.isYou?' (you)':''} <span>${player.connected?'connected':'reconnecting'}</span></li>`).join('')}</ul></section><div class="game-controls"><button class="button quiet" data-setting="mute">Sound: ${localStorage.getItem('closing-bell:mute')==='yes'?'off':'on'}</button></div></section>`;
}

function renderRoom() {
  const content = room ? `<main id="main" class="room-page">${remoteBoard(room)}</main>` : `<main id="main">${landing()}</main>`;
  app.innerHTML = `${nav()}${content}${foot()}${announcer()}`;
  finishRoute(room ? 'Trade the shared market' : 'Trade goods together before the bell');
  app.querySelector<HTMLFormElement>('form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget as HTMLFormElement);
    const intent = String((event as SubmitEvent).submitter?.getAttribute('value') || 'create');
    connect(() => send({type:intent,name:form.get('name'),code:String(form.get('code') || '').toUpperCase()}));
  });
  app.querySelectorAll<HTMLElement>('[data-remote]').forEach(element => {
    element.onclick = () => {
      armAudio();
      send({ type:element.dataset.remote, code:room?.code, token:saved()?.token, goodId:element.dataset.good, side:element.dataset.side });
    };
  });
  app.querySelector<HTMLElement>('[data-setting="mute"]')?.addEventListener('click', () => {
    const muted = localStorage.getItem('closing-bell:mute') === 'yes';
    localStorage.setItem('closing-bell:mute', muted ? 'no' : 'yes');
    renderRoom();
  });
}

function socketUrl() {
  return location.hostname === 'closing-bell.sociobot.in' ? 'wss://closing-bell-realtime.sociobot.in' : 'ws://127.0.0.1:8080';
}

function connect(onOpen?:()=>void) {
  if (ws?.readyState === WebSocket.OPEN) { onOpen?.(); return; }
  if (ws?.readyState === WebSocket.CONNECTING) { if (onOpen) ws.addEventListener('open',onOpen,{once:true}); return; }
  ws = new WebSocket(socketUrl());
  if (onOpen) ws.addEventListener('open',onOpen,{once:true});
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.type === 'error') {
      error = message.status === 429 ? `${message.message} Retry after ${message.retryAfter} second.` : message.message;
      notice(error);
      if (!room) renderRoom();
      return;
    }
    if (message.type === 'state') {
      previousRoomPhase = room?.phase || previousRoomPhase;
      room = message.room;
      const me = room!.players.find(player => player.isYou);
      if (me) localStorage.setItem(roomKey,JSON.stringify({code:room!.code,token:me.id}));
      error = '';
      if (previousRoomPhase === 'playing' && room!.phase === 'finished') ringBell(localStorage.getItem('closing-bell:mute') === 'yes');
      previousRoomPhase = room!.phase;
      renderRoom();
    }
  };
  ws.onerror = () => { error = 'The room service is unavailable. Check your connection and try again.'; if (!room) renderRoom(); };
  ws.onclose = event => { if (room && event.code !== 1000) notice(event.code === 1013 ? 'Too many messages. Wait one second, then reopen the page.' : 'Connection lost. Reopen this page to reconnect your saved seat.'); };
}

function saved():{code:string;token:string}|null {
  try { return JSON.parse(localStorage.getItem(roomKey) || 'null'); } catch { return null; }
}

function restore() {
  const value = saved();
  if (value && !room) connect(() => send({type:'reconnect',code:value.code,token:value.token}));
}

function send(message:Record<string,unknown>) {
  if (ws?.readyState !== WebSocket.OPEN) { notice('Connecting to the room service. Try again in a moment.'); return; }
  ws.send(JSON.stringify(message));
}

function tickDemo(step:number) {
  const value = game;
  if (!value || value.phase !== 'playing') return;
  value.remainingMs = Math.max(0,value.remainingMs - step);
  const elapsed = value.total - Math.ceil(value.remainingMs / 1000);
  if (elapsed >= value.nextNewsAt && value.remainingMs > 0) {
    headline(value);
    value.nextNewsAt += 12;
    saveDemo();
    renderDemo();
  }
  if (value.remainingMs <= 0) endDemo(value);
}

function loop(timestamp:number) {
  if (!last) last = timestamp;
  if (!document.hidden && !app.querySelector<HTMLDialogElement>('dialog[open]')) {
    accumulator += Math.min(250,timestamp - last);
    while (accumulator >= fixedStep) { tickDemo(fixedStep); accumulator -= fixedStep; }
    const current = game;
    if (current?.phase === 'playing') {
      const seconds = Math.ceil(current.remainingMs / 1000);
      if (seconds !== lastPaintedSecond) {
        lastPaintedSecond = seconds;
        const timer = app.querySelector<HTMLElement>('[data-timer]');
        if (timer) timer.textContent = time(seconds);
        const bar = app.querySelector<HTMLProgressElement>('.progress');
        if (bar) { bar.value = seconds; bar.setAttribute('aria-label',`${time(seconds)} remaining`); }
        saveDemo();
      }
    }
  }
  last = timestamp;
  requestAnimationFrame(loop);
}

window.addEventListener('popstate', () => {
  if (!isDemo()) clearDemo();
  room = null;
  if (ws) ws.close();
  ws = null;
  focusRoute = true;
  route();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const dialog = app.querySelector<HTMLDialogElement>('dialog[open]');
    if (dialog) { dialog.close(); app.querySelector<HTMLElement>('[data-action="pause"]')?.focus(); }
  }
});
document.addEventListener('pointerdown', armAudio, {once:true});
document.addEventListener('keydown', armAudio, {once:true});
route();
requestAnimationFrame(loop);
