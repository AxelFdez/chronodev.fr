import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  animationsInterdites,
  collectErrors,
  DARK_BG,
  hydrated,
  LIGHT_BG,
  pageBackground,
  storeTheme,
} from './helpers';
import { PREMIERE_VISITE } from './etat-initial';

// CLAUDE.md § Vérifications — tranche 1 (socle). Les numéros renvoient à cette liste.

test.describe('HTML servi (vérification 6)', () => {
  test('contient le contenu, en français, sans requête vers Google', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<html lang="fr"');
    expect(html).toContain('Le temps ne joue plus contre vous.');
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });

  test('le script de thème est inline, bloquant, dans <head>', async ({ request }) => {
    const html = await (await request.get('/')).text();
    const head = html.slice(0, html.indexOf('</head>'));
    const tag = head.match(/<script>([^<]*chronodev-theme[^<]*)<\/script>/);
    expect(tag, 'script de thème absent de <head>').not.toBeNull();
    // Ni async, ni defer, ni src : il s'exécute pendant l'analyse du <head>, donc avant
    // que le document puisse être rendu (aucun rendu tant que <body> n'est pas atteint).
    expect(tag![0]).toBe(`<script>${tag![1]}</script>`);
  });

  test('page 404 en français', async ({ page }) => {
    const response = await page.goto('/nexiste-pas/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable.');
  });
});

test.describe('Thème (vérification 5)', () => {
  test.use({ colorScheme: 'light' });

  test('sombre par défaut, même si le système préfère le clair', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    expect(await pageBackground(page)).toBe(DARK_BG);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(errors, 'erreurs JS ou violations de CSP').toEqual([]);
  });

  test('le poussoir bascule et le choix persiste', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const toggle = page.getByRole('button', { name: 'Thème clair' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('chronodev-theme'))).toBe('light');

    await page.reload();
    await hydrated(page);
    expect(await pageBackground(page)).toBe(LIGHT_BG);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('chronodev-theme'))).toBe('dark');
  });

  test('le thème clair est en place dès le premier frame, sans attendre React', async ({
    page,
  }) => {
    // Réseau lent : CSS et JS retardés. Le premier frame ne doit dépendre que du script de <head>.
    await page.route('**/_next/static/**', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await storeTheme(page, 'light');
    await page.addInitScript(() => {
      requestAnimationFrame(() => {
        const root = document.documentElement;
        (window as unknown as { __firstFrame: object }).__firstFrame = {
          theme: root.dataset.theme,
          background: getComputedStyle(root).backgroundColor,
          reactLoaded: Object.keys(document.querySelector('button') ?? {}).some((k) =>
            k.startsWith('__react'),
          ),
        };
      });
    });
    await page.goto('/');
    const first = await page.evaluate(
      () => (window as unknown as { __firstFrame: object }).__firstFrame,
    );
    expect(first).toEqual({ theme: 'light', background: LIGHT_BG, reactLoaded: false });
  });

  test('stockage bloqué : sombre, intro non jouée, bascule utilisable, aucune erreur', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Stockage refusé', 'SecurityError');
        },
      });
    });
    const errors = collectErrors(page);
    await page.goto('/');
    await hydrated(page);
    expect(await pageBackground(page)).toBe(DARK_BG);
    await expect(page.locator('html')).toHaveAttribute('data-intro', 'vue');
    await page.getByRole('button', { name: 'Thème clair' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });

  test.describe('première visite', () => {
    test.use({ storageState: PREMIERE_VISITE });

    test('stockage disponible : intro à jouer', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-intro', 'a-jouer');
    });
  });
});

test.describe('Largeur 390 px (vérification 4)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('aucun débordement, cibles tactiles conformes', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const toggle = await page.getByRole('button', { name: 'Thème clair' }).boundingBox();
    expect(toggle).toMatchObject({ width: 54, height: 46 });
    const brand = await page.getByRole('link', { name: 'chronodev.fr' }).boundingBox();
    expect(brand!.height).toBeGreaterThanOrEqual(44);
    expect(toggle!.x - (brand!.x + brand!.width)).toBeGreaterThanOrEqual(8);
  });
});

test.describe('JavaScript désactivé (vérification 3)', () => {
  test.use({ javaScriptEnabled: false });

  test('page complète et lisible, poussoir inutile masqué', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Le temps ne joue plus contre vous.',
    );
    expect(await pageBackground(page)).toBe(DARK_BG);
    await expect(page.getByRole('button', { name: 'Thème clair' })).toBeHidden();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('aucun contexte WebGL créé (vérification 3, non-régression)', async ({ page }) => {
  await page.addInitScript(() => {
    const contexts: string[] = [];
    (window as unknown as { __contexts: string[] }).__contexts = contexts;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      contexts.push(type);
      return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof original;
  });
  await page.goto('/');
  await hydrated(page);
  await page.getByRole('button', { name: 'Thème clair' }).click();
  const contexts = await page.evaluate(
    () => (window as unknown as { __contexts: string[] }).__contexts,
  );
  expect(contexts.filter((c) => c.startsWith('webgl') || c === 'experimental-webgl')).toEqual([]);
});

test.describe('prefers-reduced-motion (vérification 2)', () => {
  test.use({ reducedMotion: 'reduce' });

  // DESIGN.md : sous reduced-motion, pas de mouvement ni de boucle ; les fondus courts restent.
  test('ni boucle, ni mouvement, seulement des fondus courts', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const toggle = page.getByRole('button', { name: 'Thème clair' });
    await toggle.hover();
    await page.mouse.down();
    const pressed = await page.evaluate(() => document.getAnimations().length);
    await page.mouse.up();
    const offending = await animationsInterdites(page);
    expect(pressed, 'l’appui sur le poussoir ne doit rien animer').toBe(0);
    expect(offending).toEqual([]);
  });
});

test.describe('axe (WCAG 2.2 AA + bonnes pratiques)', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const width of [390, 1440]) {
      test(`${theme}, ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await storeTheme(page, theme);
        await page.goto('/');
        await hydrated(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  }
});
