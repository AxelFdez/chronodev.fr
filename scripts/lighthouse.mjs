// Lighthouse (profil mobile par défaut) sur l'export servi localement.
// Un passage isolé varie de plusieurs points (91 à 99 mesurés sur un même build, surtout
// quand la machine sort d'une suite de tests) : on juge la médiane de RUNS passages, comme
// Lighthouse CI. Rapport du passage médian : artifacts/lighthouse/.
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { BASE_URL, withServer } from './lib.mjs';

const BUDGET = { performance: 0.95, accessibility: 1, 'best-practices': 1, seo: 1 };
const RUNS = 5;
const TIMEOUT_MS = 120_000; // un Chrome bloqué fait échouer la vérification, pas l'attendre

async function passage() {
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
    return await Promise.race([run, timeout]);
  } finally {
    chrome.kill();
  }
}

await withServer(async () => {
  const resultats = [];
  for (let i = 0; i < RUNS; i++) resultats.push(await passage());
  resultats.sort((a, b) => a.lhr.categories.performance.score - b.lhr.categories.performance.score);
  const { lhr, report } = resultats[Math.floor(RUNS / 2)];
  await mkdir('artifacts/lighthouse', { recursive: true });
  await writeFile('artifacts/lighthouse/mobile.html', report);

  const tous = resultats.map((r) => Math.round(r.lhr.categories.performance.score * 100));
  let failed = 0;
  for (const [id, min] of Object.entries(BUDGET)) {
    const score = lhr.categories[id].score;
    const ok = score >= min;
    if (!ok) failed++;
    const detail = id === 'performance' ? `  (passages : ${tous.join(', ')})` : '';
    console.log(
      `${ok ? 'ok   ' : 'ÉCHEC'} ${id.padEnd(15)} ${Math.round(score * 100)} (min ${min * 100})${detail}`,
    );
  }
  for (const audit of Object.values(lhr.audits)) {
    if (audit.score !== null && audit.score < 1 && audit.scoreDisplayMode === 'binary') {
      console.log(`      audit en échec : ${audit.id} — ${audit.title}`);
    }
  }
  const m = (id) => lhr.audits[id]?.displayValue;
  console.log(
    `      médiane : LCP ${m('largest-contentful-paint')} · CLS ${m('cumulative-layout-shift')} · TBT ${m('total-blocking-time')}`,
  );
  if (failed) process.exitCode = 1; // pas process.exit : withServer arrête le serveur
});
