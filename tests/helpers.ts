import type { Browser, Page } from '@playwright/test';

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

/**
 * Compare deux captures PNG, décodées dans une page vierge (sans CSP). Renvoie l'écart
 * moyen par canal et le nombre de pixels qui diffèrent de plus de 2 niveaux (au-delà du
 * bruit d'anticrénelage du moteur de rendu).
 */
export async function comparerCaptures(browser: Browser, a: Buffer, b: Buffer) {
  const page = await browser.newPage();
  const resultat = await page.evaluate(
    async ([a, b]) => {
      const pixels = async (src: string) => {
        const img = new Image();
        img.src = `data:image/png;base64,${src}`;
        await img.decode();
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height).data;
      };
      const [pa, pb] = await Promise.all([pixels(a), pixels(b)]);
      if (pa.length !== pb.length) return { moyen: Infinity, pixelsDifferents: Infinity };
      let somme = 0;
      let pixelsDifferents = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const d = [0, 1, 2].map((c) => Math.abs(pa[i + c] - pb[i + c]));
        somme += d[0] + d[1] + d[2];
        if (Math.max(...d) > 2) pixelsDifferents++;
      }
      return { moyen: somme / (pa.length / 4) / 3, pixelsDifferents };
    },
    [a.toString('base64'), b.toString('base64')],
  );
  await page.close();
  return resultat;
}
