import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const baseUrl = (process.env.GAME_URL || 'https://closing-bell.sociobot.in').replace(/\/$/, '');
const roundTimeout = Number(process.env.ROUND_TIMEOUT_MS || 390_000);

async function record(result) {
  if (process.env.REPORT_FILE) await writeFile(process.env.REPORT_FILE, `${JSON.stringify(result, null, 2)}\n`);
}

function goodFromGoal(goal) {
  if (goal.includes('Glowfruit')) return 'Glowfruit';
  if (goal.includes('weather vanes')) return 'Weather vane';
  if (goal.includes('tin robots')) return 'Tin robot';
  throw new Error(`Could not determine the assigned good from: ${goal}`);
}

const browser = await chromium.launch({ headless: true });
const contexts = await Promise.all([0, 1, 2].map(() => browser.newContext()));
const pages = await Promise.all(contexts.map(context => context.newPage()));

try {
  await Promise.all(pages.map(page => page.goto(baseUrl, { waitUntil: 'networkidle' })));
  await pages[0].locator('#remote-name').fill('Release host');
  await pages[0].getByRole('button', { name: 'Create a room' }).click();
  const code = (await pages[0].locator('.timer strong').textContent())?.trim();
  if (!code) throw new Error('The host did not receive a room code.');

  for (const [index, page] of pages.slice(1).entries()) {
    await page.locator('#remote-name').fill(`Release seat ${index + 2}`);
    await page.locator('#room-code').fill(code);
    await page.getByRole('button', { name: 'Join this room' }).click();
    await page.locator('.timer strong').filter({ hasText: code }).waitFor();
  }

  await pages[0].getByRole('button', { name: 'Open the market' }).click();
  await pages[0].getByText('Time to bell').waitFor();
  const goal = (await pages[0].locator('.rumor').textContent()) || '';
  const good = goodFromGoal(goal);
  await pages[0].getByRole('button', { name: `Buy one ${good}` }).click();
  await pages[0].getByRole('button', { name: `Buy one ${good}` }).click();
  await pages[0].getByText('Held: 2').waitFor();

  await pages[0].getByRole('heading', { level: 1, name: 'You met your goal' }).waitFor({ timeout: roundTimeout });
  await Promise.all(pages.slice(1).map(page => page.locator('.end-screen h1').waitFor({ timeout: 15_000 })));
  const reports = await Promise.all(pages.map(async page => ({
    heading: await page.locator('.end-screen h1').textContent(),
    report: await page.locator('.end-screen').innerText()
  })));
  if (!reports.every(({ report }) => /finished with \d+ tickets/i.test(report))) {
    throw new Error('Each browser did not receive a final ticket report.');
  }

  const result = {
    room: code,
    players: 3,
    assignedGoal: goal,
    bought: good,
    hostHeading: reports[0].heading,
    endHeadings: reports.map(({ heading }) => heading),
    finalReports: reports.map(({ report }) => /finished with \d+ tickets/i.test(report))
  };
  await record(result);
  console.log(JSON.stringify(result, null, 2));
} finally {
  await Promise.all(contexts.map(context => context.close()));
  await browser.close();
}
