import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('browser controls speak the authoritative server trade protocol', async ({ browser }) => {
  const contexts = await Promise.all([0,1,2].map(() => browser.newContext()));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  try {
    await Promise.all(pages.map(page => page.goto('/')));
    await pages[0].getByRole('button',{name:/Create a room/}).click();
    const code = (await pages[0].locator('.timer strong').textContent())!.trim();
    for (const page of pages.slice(1)) {
      await page.locator('#room-code').fill(code);
      await page.getByRole('button',{name:/Join this room/}).click();
      await expect(page.locator('.timer strong')).toHaveText(code);
    }
    await pages[0].getByRole('button',{name:/Open the market/}).click();
    const openingPrice = Number((await pages[0].locator('.price').first().textContent())!.match(/\d+/)![0]);
    await pages[0].getByRole('button',{name:'Buy one Glowfruit'}).click();
    await expect(pages[0].getByText('Held: 1')).toBeVisible();
    await expect.poll(async () => Number((await pages[1].locator('.price').first().textContent())!.match(/\d+/)![0])).not.toBe(openingPrice);
    await expect(pages[0].getByText('Unknown action.')).toHaveCount(0);
    await expect(pages[0].locator('h1')).toHaveCount(1);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('a scripted shared run reaches its scored end screen and restarts', async ({ browser }) => {
  const contexts = await Promise.all([0,1,2].map(() => browser.newContext()));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  try {
    await Promise.all(pages.map(page => page.goto('/')));
    await pages[0].getByRole('button',{name:/Create a room/}).click();
    const code = (await pages[0].locator('.timer strong').textContent())!.trim();
    for (const page of pages.slice(1)) {
      await page.locator('#room-code').fill(code);
      await page.getByRole('button',{name:/Join this room/}).click();
      await expect(page.locator('.timer strong')).toHaveText(code);
    }
    await pages[0].getByRole('button',{name:/Open the market/}).click();
    const goal = await pages[0].locator('.goal').textContent();
    const good = goal?.includes('Glowfruit') ? 'Glowfruit' : goal?.includes('weather vanes') ? 'Weather vane' : 'Tin robot';
    await pages[0].getByRole('button',{name:`Buy one ${good}`}).click();
    await pages[0].getByRole('button',{name:`Buy one ${good}`}).click();
    await expect(pages[0].getByRole('heading',{name:'You met your goal'})).toBeVisible({timeout:13000});
    await pages[0].getByRole('button',{name:'Play another round'}).click();
    await expect(pages[0].locator('.wallet strong').first()).toHaveText('180');
    await expect(pages[0].getByText('Held: 0').first()).toBeVisible();
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('@claim:timed-private-rumors each shared seat receives a private market update that moves prices', async ({ browser }) => {
  const contexts = await Promise.all([0,1,2].map(() => browser.newContext()));
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  type State = {
    type:'state';
    room:{
      rumorBeat:number;
      rumor:string;
      objective:string;
      goods:Array<{price:number}>;
      players:Array<Record<string,unknown> & {isYou:boolean}>;
    };
  };
  const receivedStates:State[][] = pages.map(() => []);
  pages.forEach((page,index) => page.on('websocket',socket => {
    socket.on('framereceived',frame => {
      try {
        const value = JSON.parse(frame.payload.toString()) as State;
        if (value.type === 'state') receivedStates[index].push(value);
      } catch { /* only inspect JSON state frames */ }
    });
  }));
  try {
    await Promise.all(pages.map(page => page.goto('/')));
    await pages[0].getByRole('button',{name:/Create a room/}).click();
    const code = (await pages[0].locator('.timer strong').textContent())!.trim();
    for (const page of pages.slice(1)) {
      await page.locator('#room-code').fill(code);
      await page.getByRole('button',{name:/Join this room/}).click();
    }
    await pages[0].getByRole('button',{name:/Open the market/}).click();
    const openingPrices = await Promise.all(pages.map(page => page.locator('.price').allTextContents()));
    const openingRumors = await Promise.all(pages.map(page => page.locator('.rumor').textContent()));

    await Promise.all(pages.map((page,index) => expect.poll(
      async () => page.locator('.rumor').textContent(),
      {timeout:5_000,message:`seat ${index + 1} receives its first private rumor`}
    ).not.toBe(openingRumors[index])));

    const updatedPrices = await Promise.all(pages.map(page => page.locator('.price').allTextContents()));
    const updatedRumors = await Promise.all(pages.map(page => page.locator('.rumor').textContent()));
    updatedPrices.forEach((prices,index) => expect(prices,`seat ${index + 1} sees changed shared prices`).not.toEqual(openingPrices[index]));
    expect(updatedRumors[0]).not.toBe(updatedRumors[1]);

    await expect.poll(
      () => receivedStates.filter(states => states.some(state => state.room.rumorBeat === 1)).length,
      {timeout:5_000,message:'all three clients receive the authoritative timed state'}
    ).toBe(3);
    receivedStates.forEach((states,index) => {
      const state = states.findLast(value => value.room.rumorBeat === 1)!;
      expect(state.room.rumor,`seat ${index + 1} protocol rumor`).toContain(updatedRumors[index]!.replace('Private rumor 1:', '').trim());
      expect(state.room.objective,`seat ${index + 1} receives one private goal`).not.toBe('');
      expect(state.room.players.filter(player => player.isYou),`seat ${index + 1} has one private player record`).toHaveLength(1);
      for (const otherSeat of state.room.players.filter(player => !player.isYou)) {
        expect(Object.keys(otherSeat).sort(),`seat ${index + 1} cannot read another seat's private fields`)
          .toEqual(['connected','id','isYou','name']);
      }
    });
  } finally { await Promise.all(contexts.map(context => context.close())); }
});

test('@claim:reaches-bell a scripted winning run reaches its end screen', async ({ page }) => {
  await page.goto('/demo?duration=2');
  await page.getByRole('button',{name:'Buy one Tin robot'}).click();
  await page.getByRole('button',{name:'Buy one Tin robot'}).click();
  await expect(page.getByRole('heading',{level:1,name:'You met your goal'})).toBeVisible({timeout:7000});
  await expect(page.getByText(/finished with \d+ tickets/i)).toBeVisible();
});

test('a run can be lost when the objective is missed', async ({ page }) => {
  await page.goto('/demo?duration=1');
  await expect(page.getByRole('heading',{level:1,name:'The goal slipped away'})).toBeVisible({timeout:6000});
  await expect(page.getByText('You needed two tin robots when the bell rang.')).toBeVisible();
});

test('@claim:restart-resets play again starts immediately with opening tickets and holdings', async ({ page }) => {
  await page.goto('/demo?duration=1');
  await expect(page.getByRole('heading',{name:'The goal slipped away'})).toBeVisible({timeout:6000});
  await page.getByRole('button',{name:/Play another round/}).click();
  await expect(page.getByRole('heading',{level:1,name:'Trade the practice market'})).toBeVisible();
  await expect(page.getByText('Held: 0').first()).toBeVisible();
  await expect(page.locator('[data-cash]')).toHaveText('180');
});

test('@claim:demo-isolation demo reload is recoverable, local-only, and discarded on exit', async ({ page }) => {
  const requests:string[] = [];
  const sockets:string[] = [];
  page.on('request',request => requests.push(request.url()));
  page.on('websocket',socket => sockets.push(socket.url()));
  await page.addInitScript(() => localStorage.setItem('closing-bell:test-real','keep'));
  await page.goto('/demo');
  await page.getByRole('button',{name:'Buy one Glowfruit'}).click();
  await page.reload();
  await expect(page.getByText('Held: 1').first()).toBeVisible();
  const storage = await page.evaluate(() => ({
    local:{...localStorage},
    session:{...sessionStorage}
  }));
  expect(storage.local['closing-bell:test-real']).toBe('keep');
  expect(Object.keys(storage.local).filter(key => key.startsWith('demo:'))).toEqual([]);
  expect(Object.keys(storage.session)).toEqual(['demo:closing-bell:run']);
  expect(new Set(requests.map(url => new URL(url).origin))).toEqual(new Set(['http://127.0.0.1:4173']));
  expect(sockets.every(url => new URL(url).origin === 'ws://127.0.0.1:4173')).toBe(true);
  await page.getByRole('button',{name:'Start for real'}).click();
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter(key => key.startsWith('demo:')))).toEqual([]);
  expect(await page.evaluate(() => localStorage.getItem('closing-bell:test-real'))).toBe('keep');
});

test('@claim:ninety-second-demo the one-click sample starts a 90-second round', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link',{name:/Try it with sample data/}).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByRole('heading',{level:1,name:'Trade the practice market'})).toBeVisible();
  await expect(page.locator('progress.progress')).toHaveAttribute('max','90');
  await expect(page.getByRole('button',{name:'Buy one Glowfruit'})).toBeVisible();
});

test('@claim:fictional-free a new player can trade the full sample without an account or payment step', async ({ page }) => {
  const requests:string[] = [];
  page.on('request',request => requests.push(request.url()));
  await page.goto('/');
  await page.getByRole('link',{name:/Try it with sample data/}).click();
  await page.getByRole('button',{name:'Buy one Glowfruit'}).click();
  await expect(page.getByText('Held: 1').first()).toBeVisible();
  expect(new Set(requests.map(url => new URL(url).origin))).toEqual(new Set(['http://127.0.0.1:4173']));
});

test('@claim:settings-persist the demo sound choice survives reload in its isolated state', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button',{name:'Sound: on'}).click();
  await page.reload();
  await expect(page.getByRole('button',{name:'Sound: off'})).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('closing-bell:mute'))).toBeNull();
});

test('keyboard play and pause recovery work without a pointer', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button',{name:'Buy one Glowfruit'}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Held: 1').first()).toBeVisible();
  await page.getByRole('button',{name:'Pause'}).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Pause'})).toBeFocused();
});

test('all product routes have one h1 and no serious accessibility violations', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  for (const path of ['/','/demo','/privacy','/terms','/404.html']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    const results = await new AxeBuilder({page}).analyze();
    expect(results.violations.filter(result => ['serious','critical'].includes(result.impact ?? '')),path).toEqual([]);
  }
});

test('SPA route changes update title, canonical, focus, and announcement', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link',{name:'Demo'}).click();
  await expect(page).toHaveTitle('Demo — Closing Bell');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://closing-bell.sociobot.in/demo');
  await expect(page.getByRole('heading',{level:1,name:'Trade the practice market'})).toBeFocused();
  await expect(page.locator('.route-announcer')).toHaveText('Trade the practice market');
});

test('the 390px first screen and one-click demo do not overflow or clip controls', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.locator('.market-preview')).toBeVisible();
  const targets = await page.locator('a,button,input').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }).map(element => ({name:(element.textContent || element.getAttribute('aria-label') || '').trim(),rect:element.getBoundingClientRect().toJSON()})));
  for (const target of targets) {
    expect(target.rect.height,`${target.name} touch height`).toBeGreaterThanOrEqual(44);
    expect(target.rect.right,`${target.name} clipped right`).toBeLessThanOrEqual(390);
  }
  await page.getByRole('link',{name:/Try it with sample data/}).click();
  await expect(page.getByRole('button',{name:'Buy one Glowfruit'})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const demoTargets = await page.locator('a,button').evaluateAll(elements => elements.map(element => element.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0).map(rect => rect.height));
  expect(demoTargets.every(height => height >= 44)).toBe(true);
});

test('the static product does not register an offline update worker', async ({ page }) => {
  await page.goto('/demo');
  expect(await page.evaluate(async () => 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0)).toBe(0);
});

test('reduced motion keeps the market preview still', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.market-preview')).toHaveCSS('transform','none');
});

test('countdown uses a CSP-safe progress element and logs no page errors', async ({ page }) => {
  const errors:string[] = [];
  page.on('console',message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror',exception => errors.push(exception.message));
  await page.goto('/demo?duration=4');
  await expect(page.locator('progress.progress')).toHaveAttribute('max','4');
  await expect(page.locator('progress.progress')).not.toHaveAttribute('style');
  await page.waitForTimeout(1200);
  await expect(page.locator('progress.progress')).toHaveJSProperty('value',3);
  expect(errors).toEqual([]);
});

test('@claim:60-fps the fixed-step game renders at a 60 fps target under 4x CPU throttling', async ({ page, context }) => {
  await page.setViewportSize({width:390,height:844});
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto('/demo');
  const frames = await page.evaluate(() => new Promise<number>(resolve => {
    let count = 0;
    const start = performance.now();
    const sample = (now:number) => { count += 1; if (now - start >= 3000) resolve(count); else requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  }));
  expect(frames / 3).toBeGreaterThanOrEqual(50);
  expect(frames / 3).toBeLessThanOrEqual(70);
});

test('@claim:text-reflow the active game remains usable at 200% text size on a 390px screen', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/demo');
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const timer = await page.locator('.timer').boundingBox();
  expect(timer?.x).toBeGreaterThanOrEqual(0);
  expect((timer?.x || 0) + (timer?.width || 0)).toBeLessThanOrEqual(390);
  const buy = page.getByRole('button',{name:'Buy one Glowfruit'});
  await buy.scrollIntoViewIfNeeded();
  await buy.click();
  await expect(page.getByText('Held: 1').first()).toBeVisible();
});

test('static deployment sends unknown paths to the designed 404 without inline styles', async () => {
  const config = await import('../public/staticwebapp.config.json',{with:{type:'json'}});
  expect(config.default).not.toHaveProperty('navigationFallback');
  expect(config.default.responseOverrides['404'].rewrite).toBe('/404.html');
  expect(config.default.globalHeaders['Content-Security-Policy']).toContain("frame-ancestors 'none'");
  expect(config.default.globalHeaders['Content-Security-Policy']).not.toContain("'unsafe-inline'");
  expect(config.default.routes.find((route:{route:string}) => route.route === '/assets/*').headers['Cache-Control']).toContain('immutable');
  const html = await (await fetch('http://127.0.0.1:4173/404.html')).text();
  expect(html).toContain('This board is not open');
  expect(html).not.toContain('<style>');
});
