import './style.css';

type Good = { id: string; name: string; mark: string; color: string; price: number; start: number; holding: number };
type GamePhase = 'setup' | 'playing' | 'finished';
type Game = { phase: GamePhase; demo: boolean; seed: number; cash: number; goods: Good[]; seconds: number; total: number; headlineIndex: number; status: string; objective: string; mute: boolean; reduced: boolean; final: number };

const goodsBase = [
  { id: 'citrus', name: 'Glowfruit', mark: 'GF', color: 'lime', price: 38 },
  { id: 'vane', name: 'Weather vane', mark: 'WV', color: 'plum', price: 51 },
  { id: 'robot', name: 'Tin robot', mark: 'TR', color: 'blue', price: 44 }
];
const headlines = [
  ['A lighthouse keeper orders Glowfruit lantern oil.', [8, -3, 1]],
  ['A gusty parade needs weather vanes.', [-2, 9, 0]],
  ['The school fair wants tiny robot ushers.', [0, -2, 10]],
  ['A rain shower spoils one Glowfruit crate.', [-8, 2, -1]],
  ['The bell maker buys polished weather vanes.', [1, 8, -2]],
  ['A toy museum opens a robot repair desk.', [0, 0, 9]],
  ['A snack cart finds unusually bright Glowfruit.', [7, 0, -2]],
  ['A rooftop race bans heavy weather vanes.', [0, -9, 2]]
] as const;
const objectives = ['Finish with two Glowfruit.', 'Finish with two weather vanes.', 'Finish with two tin robots.'];
const app = document.querySelector<HTMLDivElement>('#app')!;
let game: Game | null = null;
let last = 0, accumulator = 0, activeRoute = '', audio: AudioContext | null = null;

function isDemo() { return location.pathname === '/demo' || new URLSearchParams(location.search).get('demo') === '1'; }
function title(route: string) {
  return route === '/privacy' ? 'Privacy — Closing Bell' : route === '/terms' ? 'Terms — Closing Bell' : route === '/demo' ? 'Demo — Closing Bell' : 'Closing Bell — Play a short market game';
}
function nav() { return `<header class="site-header"><a class="wordmark" href="/" data-route>Closing <span>Bell</span></a><nav aria-label="Primary"><a href="/demo" data-route>Demo</a><a href="/#how" data-route>How it works</a><a href="/privacy" data-route>Privacy</a></nav></header>`; }
function footer() { return `<footer><p>Closing Bell is a fictional-goods game for short group breaks.</p><p><a href="/privacy" data-route>Privacy</a> · <a href="/terms" data-route>Terms</a> · Built by Param Factory · v1.0</p><p class="generated">Market-floor art is AI-generated and original to this game.</p></footer>`; }
function formatTime(s: number) { const m = Math.floor(s / 60); return `${m}:${String(Math.ceil(s % 60)).padStart(2, '0')}`; }
function portfolio(g: Game) { return Math.round(g.cash + g.goods.reduce((sum, x) => sum + x.price * x.holding, 0)); }
function gameData(demo: boolean): Game {
  const q = new URLSearchParams(location.search);
  const testDuration = Number(q.get('duration'));
  const total = demo ? (Number.isFinite(testDuration) && testDuration > 0 ? testDuration : 90) : 360;
  const seed = demo ? 728 : 1907;
  return { phase: 'setup', demo, seed, cash: 180, goods: goodsBase.map(x => ({ ...x, start: x.price, holding: 0 })), seconds: total, total, headlineIndex: -1, status: 'Choose a seat, then open the market.', objective: objectives[seed % objectives.length], mute: localStorage.getItem('closing-bell:mute') === 'yes', reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, final: 0 };
}
function route() {
  const raw = location.pathname === '/404' ? '/404' : location.pathname;
  const path = ['/','/demo','/privacy','/terms'].includes(raw) ? raw : '/404';
  document.title = title(path);
  activeRoute = path;
  if (path === '/privacy' || path === '/terms' || path === '/404') { game = null; renderPage(path); return; }
  const demo = path === '/demo' || isDemo();
  if (!game || game.demo !== demo) game = gameData(demo);
  renderGame();
}
function renderPage(path: string) {
  const copy = path === '/privacy' ? {
    h: 'Keep game data on this device',
    body: `<p>Closing Bell stores your mute choice and local best score in this browser. It does not use accounts, analytics, ads, or third-party requests.</p><p>Demo data uses separate keys beginning with <code>demo:closing-bell</code>. Resetting the demo removes those keys.</p>`
  } : path === '/terms' ? {
    h: 'Use fictional goods for fun',
    body: `<p>Closing Bell is a free game. It has no real assets, money, betting, prizes, or financial advice.</p><p>You may play it with friends. Do not use it to settle real wagers.</p>`
  } : { h: 'This board is not open', body: `<p>The page you requested does not exist.</p><p><a href="/" data-route>Return to the game</a></p>` };
  app.innerHTML = `${nav()}<main id="main" tabindex="-1" class="copy-page"><article><h1>${copy.h}</h1>${copy.body}</article></main>${footer()}<div class="route-note" aria-live="polite"></div>`;
  wireLinks();
  focusMain();
}
function demoBanner(g: Game) { return g.demo ? `<aside class="demo-banner" aria-label="Demo mode">Demo — sample data, nothing is saved <button data-action="reset">Reset demo</button><button data-action="real">Start for real</button></aside>` : ''; }
function setupView(g: Game) { return `<section class="setup-card" aria-labelledby="play-heading"><div><p class="eyebrow">${g.demo ? '90-second practice table' : 'Six-minute table'}</p><h2 id="play-heading">Open the market</h2><p>${g.demo ? 'Try three fictional goods before the practice bell.' : 'Trade three fictional goods until the closing bell.'}</p><ul><li>Each player starts with 180 tickets.</li><li>News arrives every 45 seconds.</li><li>${g.objective}</li></ul></div><div class="setup-actions"><label for="seat-name">Your seat name</label><input id="seat-name" maxlength="14" value="Seat 1" aria-describedby="seat-help"><small id="seat-help">This name stays on this device.</small><button class="button primary" data-action="start">Start the round <span>→</span></button><button class="button quiet" data-action="toggle-mute">Sound: ${g.mute ? 'off' : 'on'}</button></div></section>`; }
function board(g: Game) {
  const pct = Math.max(0, Math.round((g.seconds / g.total) * 100));
  const final = g.seconds <= Math.min(90, g.total / 2);
  return `<section class="game-shell ${final ? 'final-minute' : ''}" aria-label="Market game">
    <div class="board-top"><div><p class="eyebrow">${g.demo ? 'Practice market' : 'Table MKT-' + g.seed}</p><p class="status" aria-live="polite">${g.status}</p></div><div class="timer"><span>${final ? 'Final bell' : 'Time to bell'}</span><strong data-timer>${formatTime(g.seconds)}</strong></div></div>
    <div class="progress" aria-label="${formatTime(g.seconds)} remaining"><i style="width:${pct}%"></i></div>
    <div class="headline"><span aria-hidden="true">!</span><div><p class="eyebrow">Public headline</p><h2 data-headline>${g.headlineIndex < 0 ? 'The market opens. Make the first trade.' : headlines[g.headlineIndex][0]}</h2></div></div>
    <p class="rumor"><strong>Private rumor:</strong> ${g.objective}</p>
    <div class="goods" aria-label="Fictional goods">${g.goods.map((x, i) => goodCard(x, i)).join('')}</div>
    <aside class="wallet"><div><span>Tickets</span><strong data-cash>${g.cash}</strong></div><div><span>Desk value</span><strong data-value>${portfolio(g)}</strong></div><div><span>Holdings</span><strong data-holdings>${g.goods.reduce((a, x) => a + x.holding, 0)}</strong></div></aside>
    <div class="game-controls"><button class="button quiet" data-action="pause">Pause</button><button class="button quiet" data-action="toggle-mute">Sound: ${g.mute ? 'off' : 'on'}</button></div>
  </section>`;
}
function goodCard(x: Good, i: number) { const delta = x.price - x.start; return `<article class="good ${x.color}" data-good="${i}"><div class="good-title"><span class="good-mark">${x.mark}</span><div><h3>${x.name}</h3><p>Held: <b data-held>${x.holding}</b></p></div></div><p class="price" data-price>${x.price} <small class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</small></p><div class="trade"><button data-action="sell" data-good="${i}" aria-label="Sell one ${x.name}">Sell</button><button data-action="buy" data-good="${i}" aria-label="Buy one ${x.name}">Buy</button></div></article>`; }
function landing(g: Game) { return `<main id="main" tabindex="-1"><section class="hero"><div class="hero-copy"><p class="eyebrow">A short fictional-goods game</p><h1>Trade funny goods before the bell</h1><p class="lede">For friends who want one lively market round with a clear ending.</p><div class="hero-actions"><a class="button primary" href="/demo" data-route>Try it with sample data <span>→</span></a><span>Opens a 90-second practice round.</span></div><ul class="facts"><li>No accounts</li><li>No real money</li><li>Game data stays here</li></ul></div><figure class="hero-art"><img src="/assets/market-floor.webp" srcset="/assets/market-floor-small.webp 720w, /assets/market-floor.webp 1200w" sizes="(max-width: 700px) 100vw, 45vw" width="1200" height="800" fetchpriority="high" decoding="async" alt="A brass closing bell hangs over three fictional goods on a colourful market floor."></figure></section>
<section class="play-area" aria-label="Game preview">${g.phase === 'setup' ? setupView(g) : board(g)}</section>
<section id="how" class="how"><h2>How the round works</h2><ol><li><b>Pick a seat.</b><span>Start with 180 tickets and three goods.</span></li><li><b>Read the news.</b><span>Public headlines change every market price.</span></li><li><b>Trade to the bell.</b><span>Holdings liquidate when the six minutes end.</span></li></ol></section>
<section class="limits"><h2>What this game does not do</h2><p>It uses fictional goods. It has no cash-out, betting, real investments, or financial advice.</p></section></main>`; }
function renderGame() { const g = game!; app.innerHTML = `${nav()}${demoBanner(g)}${landing(g)}${footer()}<div class="route-note" aria-live="polite"></div><dialog class="pause-dialog"><h2>Market paused</h2><p>Your prices and holdings are safe here.</p><button class="button primary" data-action="resume">Resume market</button><button class="button quiet" data-action="quit">Leave this round</button></dialog>`; wireLinks(); wireGame(); }
function wireLinks() { app.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(a => a.addEventListener('click', e => { const href = a.getAttribute('href')!; if (href.startsWith('/')) { e.preventDefault(); history.pushState({}, '', href); game = null; route(); } })); }
function wireGame() { app.querySelectorAll<HTMLElement>('[data-action]').forEach(el => el.addEventListener('click', () => action(el.dataset.action!, Number(el.dataset.good)))); }
function action(kind: string, index = 0) { const g = game; if (!g) return;
  if (kind === 'restart') { game = gameData(g.demo); game.phase = 'playing'; game.status = 'A fresh market opens. The first headline lands now.'; headline(game); renderGame(); return; }
  if (kind === 'start') { g.phase = 'playing'; g.status = 'The market opens. A headline lands now.'; headline(g); renderGame(); return; }
  if (kind === 'reset') { localStorage.removeItem('demo:closing-bell:best'); game = gameData(true); renderGame(); return; }
  if (kind === 'real') { history.pushState({}, '', '/'); game = gameData(false); renderGame(); return; }
  if (kind === 'toggle-mute') { g.mute = !g.mute; localStorage.setItem('closing-bell:mute', g.mute ? 'yes' : 'no'); renderGame(); return; }
  if (kind === 'pause') { app.querySelector<HTMLDialogElement>('dialog')?.showModal(); return; }
  if (kind === 'resume') { app.querySelector<HTMLDialogElement>('dialog')?.close(); last = performance.now(); return; }
  if (kind === 'quit') { app.querySelector<HTMLDialogElement>('dialog')?.close(); g.phase = 'setup'; g.seconds = g.total; g.status = 'Round saved on this device. Open a new market when ready.'; renderGame(); return; }
  if (g.phase !== 'playing') return;
  const good = g.goods[index];
  if (kind === 'buy') { if (g.cash < good.price) { notice('Not enough tickets. Sell a holding first.'); return; } g.cash -= good.price; good.holding++; g.status = `Bought one ${good.name} for ${good.price} tickets.`; blip(520); }
  if (kind === 'sell') { if (!good.holding) { notice(`You do not hold ${good.name} yet.`); return; } g.cash += good.price; good.holding--; g.status = `Sold one ${good.name} for ${good.price} tickets.`; blip(320); }
  renderGame();
}
function notice(msg: string) { const n = app.querySelector('.route-note')!; n.textContent = msg; }
function random(g: Game) { g.seed = (g.seed * 1664525 + 1013904223) >>> 0; return g.seed / 4294967296; }
function headline(g: Game) { g.headlineIndex = (g.headlineIndex + 1) % headlines.length; const [text, moves] = headlines[g.headlineIndex]; const multiplier = g.seconds <= Math.min(90, g.total / 2) ? 1.75 : 1; g.goods.forEach((good, i) => { good.price = Math.max(8, Math.round(good.price + moves[i] * multiplier)); }); g.status = text; blip(680); }
function tick(g: Game) { const elapsed = g.total - g.seconds; const cadence = g.demo ? 12 : 45; if (Math.floor(elapsed / cadence) > Math.floor((elapsed - 1) / cadence)) headline(g); if (Math.floor(elapsed / 3) > Math.floor((elapsed - 1) / 3)) { const size = g.seconds <= Math.min(90, g.total / 2) ? 4 : 2; g.goods.forEach(x => x.price = Math.max(8, x.price + Math.round((random(g) - .45) * size))); } }
function finish(g: Game) { g.phase = 'finished'; const value = portfolio(g); g.final = value; const key = g.demo ? 'demo:closing-bell:best' : 'closing-bell:best'; const best = Math.max(value, Number(localStorage.getItem(key) || 0)); localStorage.setItem(key, String(best)); g.status = `The bell rang. Your desk liquidated at ${value} tickets.`; blip(190, .18); renderGame(); const target = app.querySelector('.play-area')!; target.innerHTML = `<section class="end-card"><p class="eyebrow">Closing report</p><h2>The bell rang</h2><p>You finished with <strong>${value} tickets</strong>.</p><p>Local best: ${best} tickets.</p><button class="button primary" data-action="restart">Play another round <span>→</span></button></section>`; wireGame(); }
function blip(freq: number, duration = .05) { const g = game; if (!g || g.mute || typeof AudioContext === 'undefined') return; audio ??= new AudioContext(); const osc = audio.createOscillator(), gain = audio.createGain(); osc.frequency.value = freq; gain.gain.value = .035; osc.connect(gain).connect(audio.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration); osc.stop(audio.currentTime + duration); }
function loop(time: number) { if (!last) last = time; const dt = Math.min(250, time - last); last = time; accumulator += dt; const g = game; if (g?.phase === 'playing' && !document.hidden && !app.querySelector<HTMLDialogElement>('dialog')?.open) while (accumulator >= 1000) { g.seconds--; tick(g); accumulator -= 1000; if (g.seconds <= 0) { finish(g); break; } const timer = app.querySelector('[data-timer]'); if (timer) timer.textContent = formatTime(g.seconds); } requestAnimationFrame(loop); }
function focusMain() { setTimeout(() => app.querySelector<HTMLElement>('#main')?.focus(), 0); }
window.addEventListener('popstate', () => { game = null; route(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') app.querySelector<HTMLDialogElement>('dialog[open]')?.close(); });
route(); requestAnimationFrame(loop);
