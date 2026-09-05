import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://closing-bell.sociobot.in';
const out = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ headless: true });

function goodFromGoal(goal) {
  if (goal.includes('Glowfruit')) return 'Glowfruit';
  if (goal.includes('weather vanes')) return 'Weather vane';
  if (goal.includes('tin robots')) return 'Tin robot';
  throw new Error(`Unknown goal: ${goal}`);
}

async function createPage(options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(base, { waitUntil: 'networkidle' });
  return { context, page, errors };
}

const result = {};
try {
  const clients = await Promise.all([
    createPage({ viewport: { width: 1366, height: 900 } }),
    createPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }),
    createPage({ viewport: { width: 1280, height: 800 } })
  ]);
  const pages = clients.map(client => client.page);
  await pages[0].locator('#remote-name').fill('Verify host');
  await pages[0].getByRole('button', { name: 'Create a room' }).click();
  const room = (await pages[0].locator('.timer strong').innerText()).trim();
  for (const [index, page] of pages.slice(1).entries()) {
    await page.locator('#remote-name').fill(`Verify seat ${index + 2}`);
    await page.locator('#room-code').fill(room);
    await page.getByRole('button', { name: 'Join this room' }).click();
    await page.locator('.timer strong').filter({ hasText: room }).waitFor();
  }
  await pages[0].getByRole('button', { name: 'Open the market' }).click();
  await pages[0].getByText('Time to bell').waitFor();
  const startedAt = new Date().toISOString();
  const startTimer = await pages[0].locator('.timer strong').innerText();
  assert.equal(startTimer, '6:00');
  const goal = await pages[0].locator('.goal').innerText();
  const bought = goodFromGoal(goal);
  const goodIndex = bought === 'Glowfruit' ? 0 : bought === 'Weather vane' ? 1 : 2;
  const openingPrice = Number((await pages[1].locator('.price').nth(goodIndex).innerText()).match(/\d+/)[0]);
  await pages[0].getByRole('button', { name: `Buy one ${bought}` }).click();
  await pages[0].getByRole('button', { name: `Buy one ${bought}` }).click();
  await pages[0].getByText('Held: 2').waitFor();
  await pages[1].locator('.price').nth(goodIndex).filter({ hasText: String(openingPrice + 4) }).waitFor();
  await pages[0].reload({ waitUntil: 'networkidle' });
  await pages[0].getByText('Held: 2').waitFor();
  const reconnectTimer = await pages[0].locator('.timer strong').innerText();
  const initialRumors = await Promise.all(pages.map(page => page.locator('.rumor').innerText()));
  await pages[0].waitForFunction(previous => {
    const text = document.querySelector('.rumor')?.textContent || '';
    return text !== previous && !text.includes('No private rumor yet');
  }, initialRumors[0], { timeout: 65_000 });
  const firstRumors = await Promise.all(pages.map(page => page.locator('.rumor').innerText()));
  assert.notEqual(firstRumors[0], firstRumors[1]);
  await pages[1].screenshot({ path: `${out}live-shared-active-phone.png`, fullPage: true });

  await pages[0].getByRole('heading', { level: 2, name: 'You met your goal' }).waitFor({ timeout: 390_000 });
  await Promise.all(pages.slice(1).map(page => page.locator('.end-card h2').waitFor({ timeout: 15_000 })));
  const endedAt = new Date().toISOString();
  const reports = await Promise.all(pages.map(async page => ({
    heading: await page.locator('.end-card h2').innerText(),
    text: await page.locator('.end-card').innerText()
  })));
  assert.ok(reports.every(report => /finished with \d+ tickets/i.test(report.text)));
  await pages[0].screenshot({ path: `${out}live-shared-end-host.png`, fullPage: true });
  await pages[1].screenshot({ path: `${out}live-shared-end-phone.png`, fullPage: true });
  await pages[0].getByRole('button', { name: 'Play another round' }).click();
  await pages[0].locator('.timer strong').filter({ hasText: '6:00' }).waitFor();
  const restart = {
    timer: await pages[0].locator('.timer strong').innerText(),
    tickets: await pages[0].locator('.wallet strong').first().innerText(),
    holdings: await pages[0].locator('.good h3 + p').allInnerTexts()
  };
  assert.deepEqual(restart, { timer: '6:00', tickets: '180', holdings: ['Held: 0', 'Held: 0', 'Held: 0'] });
  assert.ok(clients.every(client => client.errors.length === 0));
  result.fullRound = {
    room,
    players: 3,
    startedAt,
    endedAt,
    elapsedSeconds: (Date.parse(endedAt) - Date.parse(startedAt)) / 1000,
    startTimer,
    reconnectTimer,
    reconnectRestoredHolding: true,
    goal,
    bought,
    openingPrice,
    priceAfterTwoBuys: openingPrice + 4,
    firstRumors,
    distinctFirstRumorCount: new Set(firstRumors).size,
    reports,
    restart,
    errors: clients.map(client => client.errors)
  };
  await Promise.all(clients.map(client => client.context.close()));

  await new Promise(resolve => setTimeout(resolve, 1100));
  const boundaryClients = await Promise.all(Array.from({ length: 9 }, (_, index) => createPage({ viewport: { width: index === 8 ? 390 : 800, height: 700 } })));
  const boundaryPages = boundaryClients.map(client => client.page);
  await boundaryPages[0].locator('#remote-name').fill('Boundary host');
  await boundaryPages[0].getByRole('button', { name: 'Create a room' }).click();
  const boundaryRoom = (await boundaryPages[0].locator('.timer strong').innerText()).trim();
  for (let index = 1; index < 8; index += 1) {
    await boundaryPages[index].locator('#remote-name').fill(`Seat ${index + 1}`);
    await boundaryPages[index].locator('#room-code').fill(boundaryRoom);
    await boundaryPages[index].getByRole('button', { name: 'Join this room' }).click();
    await boundaryPages[index].locator('.timer strong').filter({ hasText: boundaryRoom }).waitFor();
  }
  await boundaryPages[8].locator('#remote-name').fill('Seat nine');
  await boundaryPages[8].locator('#room-code').fill(boundaryRoom);
  await boundaryPages[8].getByRole('button', { name: 'Join this room' }).click();
  await boundaryPages[8].getByText(/already has eight players/i).waitFor();
  const seatNineError = await boundaryPages[8].locator('#room-help').innerText();
  await boundaryPages[0].getByRole('button', { name: 'Open the market' }).click();
  await boundaryPages[0].locator('.timer strong').filter({ hasText: '6:00' }).waitFor();
  result.seatBoundary = { room: boundaryRoom, acceptedSeats: 8, ninthSeatError: seatNineError, startTimer: '6:00' };
  assert.ok(boundaryClients.every(client => client.errors.length === 0));
  await Promise.all(boundaryClients.map(client => client.context.close()));

  await writeFile(`${out}live-shared-evidence.json`, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
