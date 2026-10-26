import { defineConfig } from '@playwright/test';
import { INTRO_VUE } from './tests/etat-initial';

const PORT = Number(process.env.PORT ?? 4173);

// Les tests portent sur l'export (out/) servi comme en production : lancer `npm run build` avant.
export default defineConfig({
  testDir: 'tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    browserName: 'chromium',
    // Par défaut, l'intro a déjà été vue : seuls les tests de l'intro font une première visite.
    storageState: INTRO_VUE,
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: true,
  },
});
