import type { Page } from '@playwright/test';

export const DARK_BG = 'rgb(11, 13, 16)'; // --bg sombre #0B0D10
export const LIGHT_BG = 'rgb(246, 245, 242)'; // --bg clair #F6F5F2

/** Erreurs JS et messages console « error » (dont les violations de CSP). */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

/** Attend que React ait hydraté le poussoir de thème. */
export async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-pressed]');
    return !!button && Object.keys(button).some((k) => k.startsWith('__reactProps'));
  });
}

export const pageBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

/** Pré-remplit le choix de thème avant le chargement de la page. */
export async function storeTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('chronodev-theme', t), theme);
}
