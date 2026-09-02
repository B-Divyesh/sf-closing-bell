import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true },
  webServer: [
    { command: 'npm run dev -- --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
    { command: 'PORT=8080 ROUND_SECONDS=8 DATA_DIR=/tmp/closing-bell-playwright node --experimental-sqlite server/start.mjs', url: 'http://127.0.0.1:8080/health', reuseExistingServer: !process.env.CI }
  ]
});
