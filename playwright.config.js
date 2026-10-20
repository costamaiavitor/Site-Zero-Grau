import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const PORTA = Number(process.env.PORTA || 8080);
const REFERENCIAS = `tests/e2e/referencias/${process.platform}`;
const SEM_REFERENCIA = !!process.env.CI && !existsSync(REFERENCIAS);

export default defineConfig({
  testDir: 'tests/e2e',
  snapshotPathTemplate: '{testDir}/referencias/{platform}/{arg}-{projectName}{ext}',
  ignoreSnapshots: SEM_REFERENCIA,
  fullyParallel: true,
  workers: Number(process.env.WORKERS || (process.env.CI ? 2 : 1)),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 45_000,
  expect: {
    toHaveScreenshot: { maxDiffPixels: 20, animations: 'disabled', caret: 'hide', scale: 'css' }
  },
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    serviceWorkers: 'block',
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
    colorScheme: 'dark'
  },
  projects: [
    { name: 'w320', use: { browserName: 'chromium', viewport: { width: 320, height: 720 } } },
    { name: 'w768', use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } } },
    { name: 'w1280', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } }
  ],
  webServer: {
    command: 'node tests/servidor.mjs',
    url: `http://127.0.0.1:${PORTA}/index.html`,
    reuseExistingServer: !process.env.CI,
    env: { PORTA: String(PORTA) }
  }
});
