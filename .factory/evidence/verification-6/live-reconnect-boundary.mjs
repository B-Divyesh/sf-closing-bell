import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const base = 'https://closing-bell.sociobot.in';
const browser = await chromium.launch({ headless: true });
const result = {};

async function client(index, phone = false) {
  const context = await browser.newContext(phone
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 900, height: 760 } });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('#remote-name').fill(`Verify ${index}`);
  return { context, page, errors };
}

try {
  const three = await Promise.all([client(1), client(2, true), client(3)]);
  const pages = three.map(value => value.page);
  await pages[0].getByRole('button', { name: 'Create a room' }).click();
  const room = (await pages[0].locator('.timer strong').innerText()).trim();
  for (const page of pages.slice(1)) {
    await page.locator('#room-code').fill(room);
    await page.getByRole('button', { name: 'Join this room' }).click();
    await page.locator('.timer strong').filter({ hasText: room }).waitFor();
  }
  await pages[0].getByRole('button', { name: 'Open the market' }).click();
  await pages[0].locator('.timer strong').filter({ hasText: '6:00' }).waitFor();
  await pages[0].getByRole('button', { name: 'Sell one Glowfruit' }).click();
  await pages[0].getByText(/do not hold Glowfruit yet/i).waitFor();
  const invalidTrade = await pages[0].locator('.route-note').innerText();
  assert.match(invalidTrade, /do not hold Glowfruit yet/i);
  const openingPrice = Number((await pages[1].locator('.price').first().innerText()).match(/\d+/)[0]);
  await pages[0].getByRole('button', { name: 'Buy one Glowfruit' }).click();
  await pages[1].locator('.price').first().filter({ hasText: String(openingPrice + 2) }).waitFor();
  await pages[0].reload({ waitUntil: 'networkidle' });
  await pages[0].getByText('Held: 1').waitFor();
  result.reconnect = {
    room,
    clients: 3,
    invalidTrade,
    crossClientPriceImpact: [openingPrice, openingPrice + 2],
    restoredHolding: 1,
    errors: three.map(value => value.errors)
  };
  assert.ok(three.every(value => value.errors.length === 0));
  await Promise.all(three.map(value => value.context.close()));

  await new Promise(resolve => setTimeout(resolve, 1100));
  const nine = await Promise.all(Array.from({ length: 9 }, (_, index) => client(index + 1, index === 8)));
  const boundaryPages = nine.map(value => value.page);
  await boundaryPages[0].getByRole('button', { name: 'Create a room' }).click();
  const boundaryRoom = (await boundaryPages[0].locator('.timer strong').innerText()).trim();
  for (const page of boundaryPages.slice(1, 8)) {
    await page.locator('#room-code').fill(boundaryRoom);
    await page.getByRole('button', { name: 'Join this room' }).click();
    await page.locator('.timer strong').filter({ hasText: boundaryRoom }).waitFor();
  }
  await boundaryPages[8].locator('#room-code').fill(boundaryRoom);
  await boundaryPages[8].getByRole('button', { name: 'Join this room' }).click();
  await boundaryPages[8].getByText(/already has eight players/i).waitFor();
  const ninthSeat = await boundaryPages[8].locator('#room-help').innerText();
  await boundaryPages[0].getByRole('button', { name: 'Open the market' }).click();
  await boundaryPages[0].locator('.timer strong').filter({ hasText: '6:00' }).waitFor();
  result.boundary = { room: boundaryRoom, acceptedSeats: 8, ninthSeat, startTimer: '6:00' };
  assert.ok(nine.every(value => value.errors.length === 0));
  await Promise.all(nine.map(value => value.context.close()));

  await writeFile('/work/repo/.factory/evidence/verification-6/live-reconnect-boundary.json', `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
