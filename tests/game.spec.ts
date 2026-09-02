import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:reaches-bell a deterministic demo reaches its closing report', async ({ page }) => {
  await page.goto('/demo?duration=2');
  await page.getByRole('button', { name: /Start the round/ }).click();
  await expect(page.getByRole('heading', { name: 'The bell rang' })).toBeVisible({ timeout: 7_000 });
  await expect(page.getByText(/finished with/i)).toBeVisible();
});

test('@claim:restart-resets a new round restores the opening holdings', async ({ page }) => {
  await page.goto('/demo?duration=2');
  await page.getByRole('button', { name: /Start the round/ }).click();
  await expect(page.getByRole('heading', { name: 'The bell rang' })).toBeVisible({ timeout: 7_000 });
  await page.getByRole('button', { name: /Play another round/ }).click();
  await expect(page.getByText('Held: 0').first()).toBeVisible();
  await expect(page.locator('[data-cash]')).toHaveText('180');
});

test('@claim:local-only demo play makes no third-party requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: /Start the round/ }).click();
  await page.getByRole('button', { name: 'Buy one Glowfruit' }).click();
  const origins = new Set(requests.map(url => new URL(url).origin));
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('keyboard can start and trade a demo', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Start the round/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Public headline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Buy one Glowfruit' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Held: 1').first()).toBeVisible();
});

test('demo has no serious accessibility violations', async ({ page }) => {
  await page.goto('/demo');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(v => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
});

test('countdown uses a CSP-safe native progress element and does not log CSP errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/demo?duration=4');
  await page.getByRole('button', { name: /Start the round/ }).click();
  await expect(page.locator('progress.progress')).toHaveAttribute('max', '4');
  await expect(page.locator('progress.progress')).not.toHaveAttribute('style');
  await page.waitForTimeout(1200);
  await expect(page.locator('progress.progress')).toHaveJSProperty('value', 3);
  expect(errors.filter(error => /Content Security Policy|style-src/i.test(error))).toEqual([]);
});
