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

/**
 * Lit une valeur qu'un script d'init a posée sur window au premier frame. `goto` rend la
 * main au « load », qui peut précéder ce frame (constaté contre nginx en CI) : on attend
 * que la valeur existe.
 */
export async function valeurDuPremierFrame<T>(page: Page, cle: string): Promise<T> {
  const valeur = await page.waitForFunction(
    (k) => (window as unknown as Record<string, unknown>)[k],
    cle,
  );
  return (await valeur.jsonValue()) as T;
}

export const pageBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

/** Pré-remplit le choix de thème avant le chargement de la page. */
export async function storeTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript((t) => localStorage.setItem('chronodev-theme', t), theme);
}

/**
 * Compare deux captures PNG, décodées dans une page vierge (sans CSP). Renvoie l'écart
 * moyen par canal, le nombre de pixels qui diffèrent de plus de 2 niveaux (au-delà du
 * bruit d'anticrénelage du moteur de rendu) et le nombre total de pixels.
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
      const total = pa.length / 4;
      if (pa.length !== pb.length) return { moyen: Infinity, pixelsDifferents: Infinity, total };
      let somme = 0;
      let pixelsDifferents = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const d = [0, 1, 2].map((c) => Math.abs(pa[i + c] - pb[i + c]));
        somme += d[0] + d[1] + d[2];
        if (Math.max(...d) > 2) pixelsDifferents++;
      }
      return { moyen: somme / total / 3, pixelsDifferents, total };
    },
    [a.toString('base64'), b.toString('base64')],
  );
  await page.close();
  return resultat;
}

/** Heure figée pour les tests et les captures : Date ne bouge plus, les minuteurs tournent. */
export const MIDI = new Date('2026-10-26T12:00:00');
export const DIX_HEURES = new Date('2026-10-26T10:08:30');

/** Attend que la montre ait fini son changement d'état (présences à leur valeur cible). */
export async function montreAuRepos(page: Page) {
  await page.waitForFunction(() => {
    const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
    const cible = (
      { '1': ['0', '0'], '2': ['1', '0'], '3': ['1', '1'] } as Record<string, string[]>
    )[svg.dataset.etat!];
    return (
      !svg.hasAttribute('data-anime') &&
      svg.style.getPropertyValue('--w-p2') === cible[0] &&
      svg.style.getPropertyValue('--w-p3') === cible[1]
    );
  });
}

/** Angle de rotation lu sur l'attribut transform d'une aiguille. */
export const angle = (page: Page, aiguille: string) =>
  page.evaluate(
    (a) =>
      Number(
        document
          .querySelector(`[data-aiguille="${a}"]`)!
          .getAttribute('transform')!
          .match(/rotate\(([-\d.]+)/)![1],
      ),
    aiguille,
  );

/**
 * Animations interdites sous prefers-reduced-motion (DESIGN.md § Motion) : boucle, mouvement
 * (transform, position, taille) ou durée au-delà d'un fondu court (250 ms). Les fondus courts
 * de couleur ou d'opacité restent permis.
 */
export const animationsInterdites = (page: Page) =>
  page.evaluate(() =>
    document.getAnimations().flatMap((a) => {
      const timing = a.effect!.getComputedTiming();
      const property =
        'transitionProperty' in a
          ? String(a.transitionProperty)
          : Object.keys((a.effect as KeyframeEffect).getKeyframes()[0] ?? {}).join(',');
      const problems = [];
      if (timing.iterations === Infinity) problems.push('boucle');
      const mouvement =
        /^(transform|translate|rotate|scale|offset.*|inset.*|top|right|bottom|left|margin.*|width|height)$/;
      if (property.split(',').some((p) => mouvement.test(p.trim()))) problems.push('mouvement');
      if (Number(timing.duration) > 250) problems.push(`durée ${timing.duration} ms`);
      return problems.length ? [`${property} : ${problems.join(', ')}`] : [];
    }),
  );
