import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://closing-bell.sociobot.in';
const result = { demo: {}, keyboard: {}, mobile: {}, accessibility: {}, shared: {} };
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const waitFor = async (check, message, timeout = 10_000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = await check();
    if (value) return value;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
};
const activeName = page => page.evaluate(() => {
  const node = document.activeElement;
  return node?.getAttribute('aria-label') || node?.textContent?.trim() || node?.getAttribute('href') || '';
});

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', request => requests.push(request.url()));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await page.waitForURL(`${base}/demo`);
  assert(await page.getByRole('heading', { level: 1, name: 'Trade the practice market' }).isVisible(), 'One-click demo did not open active play');
  assert(await page.locator('progress.progress').getAttribute('max') === '90', 'One-click demo is not 90 seconds');

  await page.goto(`${base}/demo?duration=4`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Sell one Tin robot' }).click();
  const invalidRecovery = await page.getByRole('status').first().textContent();
  assert(invalidRecovery?.includes('Buy one first'), 'Invalid sell did not explain recovery');
  await page.getByRole('button', { name: 'Buy one Tin robot' }).click();
  await page.getByRole('button', { name: 'Buy one Tin robot' }).click();
  await page.screenshot({ path: '.factory/evidence/verification-3/live-demo-active.png', fullPage: false });
  await page.getByRole('heading', { level: 1, name: 'You met your goal' }).waitFor({ timeout: 8_000 });
  const endText = await page.locator('main').innerText();
  assert(/finished with \d+ tickets/i.test(endText), 'Winning report lacks final tickets');
  await page.screenshot({ path: '.factory/evidence/verification-3/live-demo-win.png', fullPage: false });
  await page.getByRole('button', { name: /Play another round/ }).click();
  const restartCash = await page.locator('[data-cash]').textContent();
  const restartHoldings = await page.getByText('Held: 0').count();
  assert(restartCash === '180' && restartHoldings === 3, 'Restart did not reset cash and holdings');

  await page.goto(`${base}/demo?duration=1`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: 'The goal slipped away' }).waitFor({ timeout: 6_000 });
  const lossText = await page.locator('main').innerText();
  assert(lossText.includes('You needed two tin robots'), 'Loss report lacks objective feedback');

  await page.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const frameSample = await page.evaluate(() => new Promise(resolve => {
    let frames = 0;
    const started = performance.now();
    const sample = now => {
      frames += 1;
      if (now - started >= 3000) resolve({ frames, elapsedMs: now - started });
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  }));
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  result.demo = {
    invalidRecovery,
    endHeading: 'You met your goal',
    finalTicketReport: /finished with \d+ tickets/i.test(endText),
    lossHeading: 'The goal slipped away',
    restartCash,
    restartZeroHoldingCards: restartHoldings,
    requestOrigins: [...new Set(requests.map(url => new URL(url).origin))],
    errors,
    frameSample,
    fps: Number((frameSample.frames / (frameSample.elapsedMs / 1000)).toFixed(2))
  };
  assert(result.demo.requestOrigins.length === 1 && result.demo.requestOrigins[0] === base, 'Demo contacted another origin');
  assert(errors.length === 0, `Live demo logged errors: ${errors.join('; ')}`);
  await context.close();

  const keyboardContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const keyboardPage = await keyboardContext.newPage();
  await keyboardPage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  const tabOrder = [];
  let foundBuy = false;
  for (let index = 0; index < 20; index += 1) {
    await keyboardPage.keyboard.press('Tab');
    const name = await activeName(keyboardPage);
    tabOrder.push(name);
    if (name === 'Buy one Glowfruit') { foundBuy = true; break; }
  }
  assert(foundBuy, 'Buy control was not reachable by Tab');
  const focusStyle = await keyboardPage.evaluate(() => {
    const style = getComputedStyle(document.activeElement);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, outlineColor: style.outlineColor };
  });
  await keyboardPage.keyboard.press('Enter');
  assert(await keyboardPage.getByText('Held: 1').first().isVisible(), 'Enter did not buy');
  let foundPause = false;
  for (let index = 0; index < 20; index += 1) {
    await keyboardPage.keyboard.press('Tab');
    const name = await activeName(keyboardPage);
    tabOrder.push(name);
    if (name === 'Pause') { foundPause = true; break; }
  }
  assert(foundPause, 'Pause was not reachable by Tab');
  await keyboardPage.keyboard.press('Space');
  assert(await keyboardPage.getByRole('dialog').isVisible(), 'Space did not open pause dialog');
  await keyboardPage.keyboard.press('Escape');
  const restoredFocus = await activeName(keyboardPage);
  assert(restoredFocus === 'Pause', 'Escape did not restore focus to Pause');
  result.keyboard = { tabOrder, focusStyle, enterBought: true, spacePaused: true, restoredFocus };
  await keyboardContext.close();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const mobilePage = await mobileContext.newPage();
  for (const path of ['/', '/demo', '/privacy', '/terms', '/missing-verification-3']) {
    const response = await mobilePage.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const axe = await new AxeBuilder({ page: mobilePage }).analyze();
    result.accessibility[path] = {
      status: response?.status(),
      title: await mobilePage.title(),
      h1Count: await mobilePage.locator('h1').count(),
      mainCount: await mobilePage.locator('main').count(),
      seriousCritical: axe.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').map(item => item.id)
    };
    assert(result.accessibility[path].h1Count === 1 && result.accessibility[path].mainCount === 1, `${path} lacks one h1/main`);
    assert(result.accessibility[path].seriousCritical.length === 0, `${path} has serious/critical axe findings`);
  }
  await mobilePage.goto(base, { waitUntil: 'networkidle' });
  const rootLayout = await mobilePage.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  const targets = await mobilePage.locator('a,button,input').evaluateAll(elements => elements.filter(element => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }).map(element => {
    const rect = element.getBoundingClientRect();
    return { name: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('name'), width: rect.width, height: rect.height, right: rect.right };
  }));
  const minHeight = Math.min(...targets.map(target => target.height));
  const clipped = targets.filter(target => target.right > 390.5);
  const previewTransform = await mobilePage.locator('.market-preview').evaluate(element => getComputedStyle(element).transform);
  await mobilePage.screenshot({ path: '.factory/evidence/verification-3/live-first-screen-mobile.png', fullPage: false });
  await mobilePage.goto(`${base}/demo`, { waitUntil: 'networkidle' });
  const demoLayout = await mobilePage.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  await mobilePage.screenshot({ path: '.factory/evidence/verification-3/live-demo-mobile.png', fullPage: false });
  result.mobile = { rootLayout, demoLayout, targetCount: targets.length, minTargetHeight: minHeight, clipped, reducedMotionPreviewTransform: previewTransform };
  assert(rootLayout.scrollWidth <= 390 && demoLayout.scrollWidth <= 390, 'Mobile layout overflows');
  assert(minHeight >= 44 && clipped.length === 0, 'Mobile targets are too small or clipped');
  assert(previewTransform === 'none', 'Reduced motion did not remove preview rotation');
  await mobileContext.close();

  const sharedContexts = await Promise.all([0, 1, 2].map(() => browser.newContext({ viewport: { width: 1280, height: 800 } })));
  const sharedPages = await Promise.all(sharedContexts.map(context => context.newPage()));
  const sharedErrors = [];
  sharedPages.forEach(page => {
    page.on('console', message => { if (message.type() === 'error') sharedErrors.push(message.text()); });
    page.on('pageerror', error => sharedErrors.push(error.message));
  });
  try {
    await Promise.all(sharedPages.map(page => page.goto(base, { waitUntil: 'networkidle' })));
    await sharedPages[0].locator('#remote-name').fill('');
    await sharedPages[0].getByRole('button', { name: /Create a room/ }).click();
    const emptyNameValidation = await sharedPages[0].locator('#remote-name').evaluate(input => input.validationMessage);
    assert(emptyNameValidation.length > 0, 'Empty seat name was accepted');
    await sharedPages[0].locator('#room-code').fill('ABCD');
    await sharedPages[0].getByRole('button', { name: 'Join this room' }).click();
    const shortCodeValidation = await sharedPages[0].locator('#room-code').evaluate(input => input.validationMessage);
    assert(shortCodeValidation.length > 0, 'Short room code was accepted');
    await sharedPages[0].locator('#remote-name').fill('Host');
    await sharedPages[0].locator('#room-code').fill('11111');
    await sharedPages[0].getByRole('button', { name: 'Join this room' }).click();
    await waitFor(async () => (await sharedPages[0].locator('#room-help').textContent())?.includes('Room code not found'), 'Missing room did not show a recovery message');
    await sharedPages[0].getByRole('button', { name: /Create a room/ }).click();
    const code = (await sharedPages[0].locator('.timer strong').textContent()).trim();
    for (let index = 1; index < 3; index += 1) {
      await sharedPages[index].locator('#remote-name').fill(`Guest ${index}`);
      await sharedPages[index].locator('#room-code').fill(code);
      await sharedPages[index].getByRole('button', { name: 'Join this room' }).click();
      await waitFor(async () => (await sharedPages[index].locator('.timer strong').textContent())?.trim() === code, `Guest ${index} did not join`);
    }
    await waitFor(async () => (await sharedPages[0].locator('.players').innerText()).includes('Guest 2'), 'Host did not see all three seats');
    await sharedPages[0].getByRole('button', { name: 'Open the market' }).click();
    await waitFor(async () => (await sharedPages[0].locator('.timer strong').textContent())?.trim() === '6:00', 'Live shared round did not start at 6:00');
    const goal = await sharedPages[0].locator('.rumor').textContent();
    const good = goal.includes('Glowfruit') ? 'Glowfruit' : goal.includes('weather vanes') ? 'Weather vane' : 'Tin robot';
    const goodIndex = good === 'Glowfruit' ? 0 : good === 'Weather vane' ? 1 : 2;
    const openingPrice = Number((await sharedPages[1].locator('.price').nth(goodIndex).textContent()).match(/\d+/)[0]);
    await sharedPages[0].getByRole('button', { name: `Sell one ${good}` }).click();
    await waitFor(async () => (await sharedPages[0].getByRole('status').first().textContent())?.includes('do not hold'), 'Server did not reject empty sell');
    await sharedPages[0].getByRole('button', { name: `Buy one ${good}` }).click();
    await waitFor(async () => (await sharedPages[0].getByText('Held: 1').count()) === 1, 'Authoritative buy did not update holding');
    const movedPrice = await waitFor(async () => {
      const value = Number((await sharedPages[1].locator('.price').nth(goodIndex).textContent()).match(/\d+/)[0]);
      return value !== openingPrice ? value : null;
    }, 'Other client did not see price impact');
    await sharedPages[0].reload({ waitUntil: 'networkidle' });
    await waitFor(async () => (await sharedPages[0].getByText('Held: 1').count()) === 1, 'Reload did not reconnect the held position');
    result.shared = { code, players: 3, openingTimer: '6:00', goal, tradedGood: good, openingPrice, movedPrice, reconnectedHolding: 1, emptyNameValidation, shortCodeValidation, sharedErrors };
    assert(sharedErrors.length === 0, `Shared play logged errors: ${sharedErrors.join('; ')}`);
  } finally {
    await Promise.all(sharedContexts.map(context => context.close()));
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
