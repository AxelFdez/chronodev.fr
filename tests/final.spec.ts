import { readdirSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PREMIERE_VISITE } from './etat-initial';
import {
  allerAEpoque,
  animationsInterdites,
  collectErrors,
  hydrated,
  LIGHT_BG,
  montreAuRepos,
  storeTheme,
  valeurDuPremierFrame,
} from './helpers';

// Tranche 7 : passe finale. Les six vérifications de CLAUDE.md, sur toutes les pages et
// tous les états, là où les tests des tranches ne couvraient qu'une partie.

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const axe = async (page: Page) =>
  (await new AxeBuilder({ page }).withTags(WCAG).analyze()).violations.map(
    (v) => `${v.id} : ${v.help} (${v.nodes.length})`,
  );

const debordement = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Mots de titres coupés sur deux lignes (un titre qui « casse mal »). */
const motsCoupes = (page: Page) =>
  page.evaluate(() => {
    const fautes: string[] = [];
    for (const titre of document.querySelectorAll('h1, h2, h3, h4')) {
      if (!(titre as HTMLElement).checkVisibility()) continue;
      const walker = document.createTreeWalker(titre, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        for (const m of n.textContent!.matchAll(/\S+/g)) {
          const r = document.createRange();
          r.setStart(n, m.index!);
          r.setEnd(n, m.index! + m[0].length);
          const lignes = new Set([...r.getClientRects()].map((c) => Math.round(c.top)));
          if (lignes.size > 1) fautes.push(`« ${m[0]} » dans « ${titre.textContent} »`);
        }
      }
    }
    return fautes;
  });

// --- Vérification 4 : 390 px (et 360 px, Android courant) ---

for (const largeur of [390, 360]) {
  test.describe(`${largeur} px : aucun débordement, aucun titre coupé`, () => {
    test.use({ viewport: { width: largeur, height: 800 } });

    for (const [epoque, nom] of [
      ['avant', 'Avant'],
      ['pendant', 'Pendant'],
      ['apres', 'Après'],
    ] as const) {
      test(`accueil, ${nom}`, async ({ page }) => {
        await page.goto('/');
        await hydrated(page);
        await allerAEpoque(page, epoque);
        expect(await debordement(page)).toBeLessThanOrEqual(0);
        expect(await motsCoupes(page)).toEqual([]);
      });
    }

    for (const chemin of ['/mentions-legales/', '/nexiste-pas/']) {
      test(chemin, async ({ page }) => {
        await page.goto(chemin);
        expect(await debordement(page)).toBeLessThanOrEqual(0);
        expect(await motsCoupes(page)).toEqual([]);
      });
    }

    test.describe('intro', () => {
      test.use({ storageState: PREMIERE_VISITE });
      test('écran d’attente', async ({ page }) => {
        await page.goto('/');
        await hydrated(page);
        expect(await debordement(page)).toBeLessThanOrEqual(0);
      });
    });
  });
}

// --- Vérification 3 : JavaScript désactivé, sur chaque page ---

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('mentions légales complètes', async ({ page }) => {
    await page.goto('/mentions-legales/');
    for (const titre of ['Mentions légales', 'Éditeur', 'Hébergement', 'Données personnelles']) {
      await expect(page.getByRole('heading', { name: titre })).toBeVisible();
    }
  });

  test('page 404 utilisable', async ({ page }) => {
    await page.goto('/nexiste-pas/');
    await expect(page.getByRole('link', { name: 'Revenir à l’accueil' })).toBeVisible();
  });
});

// --- Vérification 1 : contrastes et axe, sur ce qui restait hors champ ---

test.describe('axe : menu ouvert, page 404', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`menu ouvert, ${theme}`, async ({ page }) => {
      await storeTheme(page, theme);
      await page.goto('/');
      await hydrated(page);
      await page.getByText('Menu', { exact: true }).click();
      await expect(page.getByRole('navigation', { name: 'Menu' })).toBeVisible();
      expect(await axe(page)).toEqual([]);
    });

    test(`404, ${theme}`, async ({ page }) => {
      await storeTheme(page, theme);
      await page.goto('/nexiste-pas/');
      expect(await axe(page)).toEqual([]);
    });
  }
});

// --- Vérification 2 : mouvement réduit, sur un parcours complet ---

test.describe('mouvement réduit : parcours complet', () => {
  test.use({ reducedMotion: 'reduce' });

  test('époques, menu, thème, chrono : ni boucle, ni mouvement', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const etapes: [string, () => Promise<unknown>][] = [
      ['Avant', () => allerAEpoque(page, 'avant')],
      ['Pendant', () => allerAEpoque(page, 'pendant')],
      ['Après', () => allerAEpoque(page, 'apres')],
      ['menu', () => page.getByText('Menu', { exact: true }).click()],
      ['menu fermé', () => page.keyboard.press('Escape')],
      ['thème', () => page.getByRole('button', { name: 'Thème clair' }).click()],
      ['chrono relancé', () => page.getByRole('button', { name: 'Arrêter le chrono' }).click()],
    ];
    for (const [nom, agir] of etapes) {
      await agir();
      expect(await animationsInterdites(page), nom).toEqual([]);
    }
  });
});

// --- Vérification 5 : le thème suit le visiteur de page en page, sans flash ---

test('thème clair : conservé sur les mentions légales, dès le premier frame', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Thème clair' }).click();
  await page.addInitScript(() => {
    requestAnimationFrame(() => {
      (window as unknown as { __fond: string }).__fond = getComputedStyle(
        document.documentElement,
      ).backgroundColor;
    });
  });
  await page.goto('/mentions-legales/');
  expect(await valeurDuPremierFrame(page, '__fond')).toBe(LIGHT_BG);
});

// --- Vérification 6 : le HTML servi, tel quel ---

test('le HTML servi contient offres, preuves et contact', async ({ request }) => {
  const html = await (await request.get('/')).text();
  for (const texte of [
    'Offres',
    '[OFFRE_NOM]',
    '[PRIX]',
    'Preuves',
    '[PREUVE_CLIENT]',
    'Contact',
    '[EMAIL]',
    '[TELEPHONE]',
  ]) {
    expect(html, texte).toContain(texte);
  }
});

// --- Hors liste, mais vérifié avant la mise en ligne ---

test('en-têtes de sécurité et CSP stricte', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(h['content-security-policy']).toContain("script-src 'self' 'sha256-");
  expect(h['content-security-policy']).not.toContain('unsafe-inline');
  expect(h['content-security-policy']).not.toContain('unsafe-eval');
});

test('robots.txt et sitemap.xml', async ({ request }) => {
  expect(await (await request.get('/robots.txt')).text()).toContain(
    'Sitemap: https://chronodev.fr/sitemap.xml',
  );
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('<loc>https://chronodev.fr/</loc>');
  expect(sitemap).toContain('<loc>https://chronodev.fr/mentions-legales/</loc>');
});

test('aucune carte de sources (.map) publiée', () => {
  const cartes = readdirSync('out', { recursive: true }).filter((f) => String(f).endsWith('.map'));
  expect(cartes).toEqual([]);
});

test('parcours complet sans erreur dans la console', async ({ page }) => {
  const erreurs = collectErrors(page);
  await page.goto('/');
  await hydrated(page);
  for (const epoque of ['avant', 'pendant', 'apres'] as const) {
    await allerAEpoque(page, epoque);
    await montreAuRepos(page);
  }
  await page.getByText('Menu', { exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Menu' })
    .getByRole('link', { name: 'Mentions légales' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales');
  expect(erreurs).toEqual([]);
});
