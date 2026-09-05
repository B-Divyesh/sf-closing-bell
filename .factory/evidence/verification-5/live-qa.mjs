import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://closing-bell.sociobot.in';
const out = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ headless: true });
const results = { routes: {}, firstScreens: {}, demo: {}, interaction: {}, accessibility: {}, performance: {} };

async function cleanPage(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(String(error)));
  return { context, page, errors };
}

try {
  for (const [name, options] of Object.entries({
    desktop: { viewport: { width: 1440, height: 900 } },
    phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  })) {
    const { context, page, errors } = await cleanPage(options);
    const response = await page.goto(base, { waitUntil: 'networkidle' });
    const headline = await page.locator('h1').innerText();
    const audience = await page.locator('.lede').innerText();
    const firstAction = await page.getByRole('link', { name: /Try it with sample data/ }).innerText();
    const previewVisible = await page.locator('.market-preview').isVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.screenshot({ path: `${out}live-first-screen-${name}.png` });
    assert.equal(response.status(), 200);
    assert.equal(headline, 'Trade goods together before the bell');
    assert.match(audience, /three to eight friends.*six-minute/i);
    assert.match(firstAction, /Try it with sample data/i);
    assert.equal(previewVisible, true);
    assert.ok(overflow <= 0);
    assert.deepEqual(errors, []);
    results.firstScreens[name] = { headline, audience, firstAction, previewVisible, overflow, errors };
    await context.close();
  }

  {
    const { context, page, errors } = await cleanPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const requests = [];
    const sockets = [];
    page.on('request', request => requests.push(request.url()));
    page.on('websocket', socket => sockets.push(socket.url()));
    await page.addInitScript(() => localStorage.setItem('closing-bell:verify-real', 'untouched'));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: /Try it with sample data/ }).click();
    await page.getByText('Demo — sample data, nothing is saved').waitFor();
    const timer = await page.locator('[data-timer]').innerText();
    const populated = {
      goods: await page.locator('.good').count(),
      tickets: await page.locator('[data-cash]').innerText(),
      headline: await page.locator('.headline h2').innerText(),
      goal: await page.locator('.goal').innerText()
    };
    await page.getByRole('button', { name: 'Buy one Glowfruit' }).click();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.getByText('Held: 1').first().isVisible(), true);
    assert.equal(await page.getByText('Demo — sample data, nothing is saved').isVisible(), true);
    await page.getByRole('button', { name: 'Reset demo' }).click();
    assert.equal(await page.locator('[data-cash]').innerText(), '180');
    assert.deepEqual(await page.locator('.good h3 + p').allInnerTexts(), ['Held: 0', 'Held: 0', 'Held: 0']);
    const realBeforeExit = await page.evaluate(() => localStorage.getItem('closing-bell:verify-real'));
    await page.getByRole('button', { name: 'Start for real' }).click();
    const storageAfterExit = await page.evaluate(() => ({
      real: localStorage.getItem('closing-bell:verify-real'),
      demoSession: Object.keys(sessionStorage).filter(key => key.startsWith('demo:')),
      demoLocal: Object.keys(localStorage).filter(key => key.startsWith('demo:'))
    }));
    assert.ok(timer === '1:30' || timer === '1:29');
    assert.deepEqual(populated.goods, 3);
    assert.equal(populated.tickets, '180');
    assert.match(populated.goal, /two tin robots/i);
    assert.equal(realBeforeExit, 'untouched');
    assert.deepEqual(storageAfterExit, { real: 'untouched', demoSession: [], demoLocal: [] });
    assert.deepEqual(new Set(requests.map(url => new URL(url).origin)), new Set([base]));
    assert.deepEqual(sockets, []);
    assert.deepEqual(errors, []);
    results.demo = { timer, populated, persistentLabel: true, reset: true, storageAfterExit, requestOrigins: [...new Set(requests.map(url => new URL(url).origin))], sockets, errors };
    await context.close();
  }

  {
    const { context, page, errors } = await cleanPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${base}/demo?duration=2`);
    await page.getByRole('button', { name: 'Sell one Glowfruit' }).click();
    const invalidSell = await page.locator('.route-note').innerText();
    await page.getByRole('button', { name: 'Buy one Tin robot' }).click();
    await page.getByRole('button', { name: 'Buy one Tin robot' }).click();
    await page.getByRole('heading', { name: 'You met your goal' }).waitFor({ timeout: 10_000 });
    await page.screenshot({ path: `${out}live-demo-win-phone.png`, fullPage: true });
    const winReport = await page.locator('.end-card').innerText();
    await page.getByRole('button', { name: 'Play another round' }).click();
    const restarted = { tickets: await page.locator('[data-cash]').innerText(), holdings: await page.locator('.good h3 + p').allInnerTexts() };
    await page.goto(`${base}/demo?duration=1`);
    await page.getByRole('heading', { name: 'The goal slipped away' }).waitFor({ timeout: 10_000 });
    const lossReport = await page.locator('.end-card').innerText();
    assert.match(invalidSell, /do not hold.*Buy one first/i);
    assert.match(winReport, /You met your goal/);
    assert.deepEqual(restarted, { tickets: '180', holdings: ['Held: 0', 'Held: 0', 'Held: 0'] });
    assert.match(lossReport, /The goal slipped away/);
    assert.deepEqual(errors, []);
    results.interaction.endScreens = { invalidSell, winReport, lossReport, restarted };

    await page.goto(`${base}/demo`);
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const reflow = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    await page.getByRole('button', { name: 'Buy one Glowfruit' }).click();
    assert.ok(reflow.scrollWidth <= reflow.width);
    results.accessibility.textReflow = { ...reflow, tradeCompleted: await page.getByText('Held: 1').first().isVisible() };
    await page.screenshot({ path: `${out}live-demo-200-percent-phone.png`, fullPage: true });
    await context.close();
  }

  {
    const { context, page, errors } = await cleanPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base);
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), 'Skip to game');
    const focusStyle = await page.locator(':focus').evaluate(element => ({ outlineWidth: getComputedStyle(element).outlineWidth, outlineColor: getComputedStyle(element).outlineColor }));
    await page.keyboard.press('Enter');
    await page.getByRole('link', { name: 'Demo' }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/demo$/);
    await page.getByRole('heading', { name: 'Trade the practice market' }).waitFor();
    await page.getByRole('button', { name: 'Buy one Tin robot' }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.getByText('Held: 1').last().isVisible(), true);
    await page.getByRole('button', { name: 'Pause' }).focus();
    await page.keyboard.press('Space');
    assert.equal(await page.getByRole('button', { name: 'Resume market' }).evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Pause' }).evaluate(element => element === document.activeElement), true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base);
    const reducedTransform = await page.locator('.market-preview').evaluate(element => getComputedStyle(element).transform);
    assert.equal(reducedTransform, 'none');
    assert.deepEqual(errors, []);
    results.accessibility.keyboard = { focusStyle, tradeWithEnter: true, dialogFocusReturn: true, reducedTransform, errors };
    await context.close();
  }

  {
    const { context, page } = await cleanPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-verification-5']) {
      const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const axe = await new AxeBuilder({ page }).analyze();
      const serious = axe.violations.filter(item => ['serious', 'critical'].includes(item.impact));
      const details = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        main: !!document.querySelector('main'),
        canonical: document.querySelector('link[rel=canonical]')?.href,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        minTargetHeight: Math.min(...[...document.querySelectorAll('a,button,input')].filter(el => {
          const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
        }).map(el => el.getBoundingClientRect().height))
      }));
      assert.equal(details.h1, 1);
      assert.equal(details.lang, 'en');
      assert.equal(details.main, true);
      assert.ok(details.overflow <= 0);
      assert.equal(serious.length, 0);
      if (path === '/missing-verification-5') {
        assert.equal(response.status(), 404);
        assert.equal(details.title, 'Page not found — Closing Bell');
      } else assert.equal(response.status(), 200);
      results.routes[path] = { status: response.status(), ...details, seriousOrCriticalAxe: serious.length };
    }
    await page.goto(base);
    const hrefs = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => link.href))]);
    const linkStatuses = {};
    for (const href of hrefs) linkStatuses[href] = (await context.request.get(href)).status();
    assert.ok(Object.values(linkStatuses).every(status => status === 200));
    const registrations = await page.evaluate(async () => 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0);
    assert.equal(registrations, 0);
    results.routes.linkStatuses = linkStatuses;
    results.routes.serviceWorkers = registrations;

    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`${base}/demo`);
    const frames = await page.evaluate(() => new Promise(resolve => {
      let count = 0; const start = performance.now();
      const step = now => { count += 1; if (now - start >= 3000) resolve({ count, elapsed: now - start }); else requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }));
    const fps = frames.count / (frames.elapsed / 1000);
    assert.ok(fps >= 50 && fps <= 70);
    results.performance = { ...frames, fps };
    await context.close();
  }

  {
    const { context, page, errors } = await cleanPage({ viewport: { width: 390, height: 844 } });
    await page.goto(base);
    await page.locator('#room-code').fill('00000');
    await page.getByRole('button', { name: 'Join this room' }).click();
    await page.getByText(/Room code not found/i).waitFor();
    const unknownRoom = await page.locator('#room-help').innerText();
    assert.match(unknownRoom, /Room code not found/i);
    assert.deepEqual(errors, []);
    results.interaction.unknownRoom = unknownRoom;
    await context.close();
  }

  await writeFile(`${out}live-qa.json`, `${JSON.stringify(results, null, 2)}\n`);
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
