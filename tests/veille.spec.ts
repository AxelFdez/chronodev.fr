import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { collectErrors, hydrated, storeTheme } from './helpers';

// Tranche 6 : le module « Dernière veille » (docs/VEILLE.md). Échec fermé : il ne s'affiche
// que pour une entrée valide, validée par Axel et de 21 jours au plus.

const MAINTENANT = new Date('2026-10-26T12:00:00Z');
const titreModule = (page: Page) => page.getByRole('heading', { name: 'Dernière veille' });

const ENTREE = {
  date: '2026-10-20',
  titre: 'Titre d’essai',
  resume: 'Résumé d’essai, en texte brut.',
  source: { nom: 'Source d’essai', url: 'https://exemple.org/article' },
  validee: { par: 'Axel', le: '2026-10-21T08:00:00Z' },
};
const fichier = (entree: object | null) => JSON.stringify({ version: 1, entree });

/** Sert le fichier de veille, puis charge la page et attend la réponse. */
async function charger(
  page: Page,
  corps: string | null,
  { statut = 200, delai = 0 }: { statut?: number; delai?: number } = {},
) {
  await page.clock.setFixedTime(MAINTENANT);
  if (corps !== null) {
    await page.route('**/veille/derniere.json', async (route) => {
      if (delai) await new Promise((r) => setTimeout(r, delai));
      await route.fulfill({ status: statut, contentType: 'application/json', body: corps });
    });
  }
  const reponse = page.waitForResponse('**/veille/derniere.json').catch(() => null);
  await page.goto('/');
  await hydrated(page);
  if (!delai) await reponse;
}

async function absent(page: Page) {
  await page.waitForTimeout(300); // laisse le temps à un rendu éventuel
  await expect(titreModule(page)).toHaveCount(0);
}

test('entrée fraîche et validée : affichée, datée, sourcée, avec la mention de relecture', async ({
  page,
}) => {
  await charger(page, fichier(ENTREE));
  await expect(titreModule(page)).toBeVisible();
  const bloc = page.locator('section[aria-labelledby="veille-titre"]');
  await expect(bloc.locator('time')).toHaveText('20 octobre 2026');
  await expect(bloc.locator('time')).toHaveAttribute('datetime', '2026-10-20');
  await expect(bloc.getByText('Titre d’essai')).toBeVisible();
  await expect(bloc.getByRole('link', { name: 'Source d’essai' })).toHaveAttribute(
    'href',
    'https://exemple.org/article',
  );
  await expect(bloc).toContainText(
    'Résumé rédigé avec l’IA, relu et validé par Axel le 21 octobre 2026.',
  );
  const lien = (await bloc.getByRole('link').boundingBox())!;
  expect(lien.height).toBeGreaterThanOrEqual(44);
});

test('le module n’est jamais présenté comme une preuve', async ({ page }) => {
  await charger(page, fichier(ENTREE));
  // Assertion à réessai : la réponse reçue ne veut pas dire le module rendu (constaté sous charge).
  await expect(page.locator('[data-epoque="apres"] h4')).toHaveText([
    'Offres',
    'Preuves',
    'Dernière veille',
  ]);
});

test.describe('seuil de 21 jours', () => {
  for (const [date, visible] of [
    ['2026-10-05', true], // 21 jours
    ['2026-10-04', false], // 22 jours
    ['2026-10-27', true], // demain : décalage horaire toléré
    ['2026-10-29', false], // dans le futur : douteux
  ] as const) {
    test(`${date} → ${visible ? 'affiché' : 'masqué'}`, async ({ page }) => {
      await charger(page, fichier({ ...ENTREE, date }));
      if (visible) await expect(titreModule(page)).toBeVisible();
      else await absent(page);
    });
  }
});

test.describe('échec fermé', () => {
  const cas: [string, string | null, { statut?: number; delai?: number }?][] = [
    ['aucune entrée (fichier livré avec le site)', null],
    ['JSON malformé', '{ "version": 1, "entree": '],
    ['version inconnue', JSON.stringify({ version: 2, entree: ENTREE })],
    ['non validée par Axel', fichier({ ...ENTREE, validee: undefined })],
    [
      'source javascript:',
      fichier({ ...ENTREE, source: { nom: 'x', url: 'javascript:alert(1)' } }),
    ],
    ['source en http', fichier({ ...ENTREE, source: { nom: 'x', url: 'http://exemple.org' } })],
    ['titre trop long', fichier({ ...ENTREE, titre: 'x'.repeat(121) })],
    ['résumé vide', fichier({ ...ENTREE, resume: '   ' })],
    ['date invalide', fichier({ ...ENTREE, date: '20/10/2026' })],
    ['404', '', { statut: 404 }],
  ];
  for (const [nom, corps, options] of cas) {
    test(nom, async ({ page }) => {
      await charger(page, corps, options);
      await absent(page);
    });
  }

  test('réponse trop lente (5 s) : abandon à 3 s, rien même à l’arrivée', async ({ page }) => {
    await charger(page, fichier(ENTREE), { delai: 5000 });
    await page.waitForTimeout(5500);
    await expect(titreModule(page)).toHaveCount(0);
  });
});

test('un résumé contenant du HTML s’affiche en texte brut', async ({ page }) => {
  const piege = '<img src="x" onerror="window.__piege = 1"> <b>gras</b>';
  await charger(page, fichier({ ...ENTREE, resume: piege }));
  const bloc = page.locator('section[aria-labelledby="veille-titre"]');
  await expect(bloc).toContainText(piege);
  expect(await bloc.locator('img, b').count()).toBe(0);
  expect(
    await page.evaluate(() => (window as unknown as { __piege?: number }).__piege),
  ).toBeUndefined();
});

test('fichier livré avec le site : rien d’affiché, aucune erreur dans la console', async ({
  page,
}) => {
  const erreurs = collectErrors(page);
  await charger(page, null);
  await absent(page);
  expect(erreurs).toEqual([]);
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('le module n’existe pas', async ({ page }) => {
    await page.goto('/');
    await expect(titreModule(page)).toHaveCount(0);
  });
});

for (const [nom, viewport] of [
  ['mobile', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 900 }],
] as const) {
  test(`${nom} : son apparition ne décale rien (CLS < 0,1)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await charger(page, fichier(ENTREE));
    await expect(titreModule(page)).toBeAttached();
    await page.waitForTimeout(300);
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          new PerformanceObserver((liste) => {
            const somme = (
              liste.getEntries() as (PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
              })[]
            )
              .filter((e) => !e.hadRecentInput)
              .reduce((s, e) => s + e.value, 0);
            resolve(somme);
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(0), 500);
        }),
    );
    expect(cls).toBeLessThan(0.1);
  });
}

test.describe('axe — module affiché', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(theme, async ({ page }) => {
      await storeTheme(page, theme);
      await charger(page, fichier(ENTREE));
      await page.locator('section[aria-labelledby="veille-titre"]').scrollIntoViewIfNeeded();
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
});
