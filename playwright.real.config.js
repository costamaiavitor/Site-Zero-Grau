// Ponta a ponta de verdade: o site servido pela API (backend/server.js), ligada a
// um MySQL de TESTE, que é zerado antes de começar. Precisa das variáveis
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD e DB_NAME (com "teste" no nome).
//   npm run test:real
import { defineConfig } from '@playwright/test';

const PORTA = Number(process.env.PORTA_API || 3011);

export const ADMIN = { email: 'admin@zerograu.test', senha: 'senha-do-admin-123' };

export default defineConfig({
  testDir: 'tests/e2e-real',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    serviceWorkers: 'block',
    locale: 'pt-BR',
    timezoneId: 'America/Fortaleza',
    colorScheme: 'dark',
    viewport: { width: 1280, height: 800 }
  },
  webServer: {
    command: 'node tests/e2e-real/zerar-banco.cjs && node backend/server.js',
    url: `http://127.0.0.1:${PORTA}/api/saude`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      PORT: String(PORTA),
      JWT_SECRET: 'segredo-dos-testes-ponta-a-ponta',
      ADMIN_EMAIL: ADMIN.email,
      ADMIN_SENHA: ADMIN.senha,
      CONSULTAR_CEP: 'false',
      LIMITE_LOGIN: '1000'
    }
  }
});
