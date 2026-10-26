// Lighthouse (profil mobile par défaut) sur l'export servi localement.
// Rapport complet : artifacts/lighthouse/mobile.html.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { BASE_URL, withServer } from './lib.mjs';

const BUDGET = { performance: 0.95, accessibility: 1, 'best-practices': 1, seo: 1 };
const TIMEOUT_MS = 120_000; // un Chrome bloqué fait échouer la vérification, pas l'attendre

await withServer(async () => {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox'],
  });
  try {
    const run = lighthouse(`${BASE_URL}/`, {
      port: chrome.port,
      output: 'html',
      logLevel: 'error',
    });
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Lighthouse bloqué après ${TIMEOUT_MS / 1000} s`)),
        TIMEOUT_MS,
      ).unref(),
    );
    const { lhr, report } = await Promise.race([run, timeout]);
    await mkdir('artifacts/lighthouse', { recursive: true });
    await writeFile('artifacts/lighthouse/mobile.html', report);

    let failed = 0;
    for (const [id, min] of Object.entries(BUDGET)) {
      const score = lhr.categories[id].score;
      const ok = score >= min;
      if (!ok) failed++;
      console.log(
        `${ok ? 'ok   ' : 'ÉCHEC'} ${id.padEnd(15)} ${Math.round(score * 100)} (min ${min * 100})`,
      );
    }
    for (const audit of Object.values(lhr.audits)) {
      if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary') {
        console.log(`      audit en échec : ${audit.id} — ${audit.title}`);
      }
    }
    const m = (id) => lhr.audits[id]?.displayValue;
    console.log(
      `      LCP ${m('largest-contentful-paint')} · CLS ${m('cumulative-layout-shift')} · TBT ${m('total-blocking-time')}`,
    );
    if (failed) process.exit(1);
  } finally {
    chrome.kill();
  }
});
