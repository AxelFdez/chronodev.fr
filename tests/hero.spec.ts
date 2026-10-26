import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { comparerCaptures, hydrated, MIDI, storeTheme } from './helpers';

// Tranche 2 : hero de conversion, montre statique corrigée, contact, mentions légales.

test.describe('HTML servi (vérification 6)', () => {
  test('le hero et le contact sont dans la source', async ({ request }) => {
    const html = await (await request.get('/')).text();
    for (const texte of [
      'Le temps ne joue plus contre vous.',
      'Développement web et automatisation, accélérés par l’IA, pilotés par un humain.',
      'Pour les PME, les startups et les particuliers.',
      'Parlons de votre projet',
      'Contact',
      '[EMAIL]',
      '[TELEPHONE]',
      'Mentions légales',
    ]) {
      expect(html, texte).toContain(texte);
    }
  });

  test('les mentions légales sont dans la source', async ({ request }) => {
    const response = await request.get('/mentions-legales/');
    expect(response.status()).toBe(200);
    const html = await response.text();
    for (const texte of ['Mentions légales', 'entrepreneur individuel', '[SIRET]', 'Hébergement']) {
      expect(html, texte).toContain(texte);
    }
  });
});

test('le CTA mène au contact', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Le temps ne joue plus contre vous.' })
    .getByRole('link', { name: 'Parlons de votre projet' })
    .click();
  await expect(page).toHaveURL(/#contact$/);
  await expect(page.getByRole('heading', { name: 'Contact' })).toBeInViewport();
});

test('valeur manquante : affichée en texte, pas de lien cassé', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href^="mailto:"], a[href^="tel:"]')).toHaveCount(0);
});

test.describe('Montre', () => {
  // Midi : trotteuse et aiguilles vers le haut, positions connues pour les tests de calques.
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(MIDI);
  });

  test('instance unique, décorative, sans élément focalisable ni id en double', async ({
    page,
  }) => {
    await page.goto('/');
    const montre = page.locator('svg[data-etat]');
    await expect(montre).toHaveCount(1);
    await expect(montre).toHaveAttribute('aria-hidden', 'true');
    await expect(montre).toHaveAttribute('data-etat', '3');
    expect(await montre.locator('a, button, [tabindex]').count()).toBe(0);
    const doublons = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(doublons).toEqual([]);
  });

  /** Élément au premier plan au point (x, y) du repère de la montre. */
  const auPremierPlan = (page: Page, x: number, y: number) =>
    page.evaluate(
      ([x, y]) => {
        const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
        const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
        const el = document.elementFromPoint(p.x, p.y)!;
        return el.closest('[data-part]')?.getAttribute('data-part') ?? el.tagName;
      },
      [x, y],
    );

  test('les aiguilles migrées sont au-dessus du sous-cadran (S1)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    expect(await auPremierPlan(page, 190, 352)).toBe('aiguilles');
  });

  test('les aiguilles h/m tiennent dans le sous-cadran', async ({ page }) => {
    await page.goto('/');
    const distances = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
      return [...document.querySelectorAll('[data-part="aiguilles"] line')].map((line) => {
        const l = line as SVGLineElement;
        const toSvg = svg.getScreenCTM()!.inverse().multiply(l.getScreenCTM()!);
        const tip = new DOMPoint(l.x2.baseVal.value, l.y2.baseVal.value).matrixTransform(toSvg);
        return Math.hypot(tip.x - 190, tip.y - 352);
      });
    });
    expect(distances).toHaveLength(2);
    for (const d of distances) expect(d).toBeLessThan(36);
  });

  test('la trotteuse passe au-dessus du jour/nuit, à toute seconde (S4)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await hydrated(page); // à midi pile, la trotteuse est à 0° : elle traverse le jour/nuit
    expect(await auPremierPlan(page, 190, 215)).toBe('trotteuse');
    expect(await auPremierPlan(page, 190, 245)).toBe('trotteuse');
  });

  test('le reflet reste dans le boîtier (S5)', async ({ page }) => {
    await page.goto('/');
    const rayonMax = await page.evaluate(() => {
      const path = document.querySelector('[data-part="reflet"]') as SVGPathElement;
      const longueur = path.getTotalLength();
      let max = 0;
      for (let i = 0; i <= 100; i++) {
        const p = path.getPointAtLength((longueur * i) / 100);
        max = Math.max(max, Math.hypot(p.x - 190, p.y - 290));
      }
      return max + Number(path.getAttribute('stroke-width')) / 2;
    });
    expect(rayonMax).toBeLessThanOrEqual(130);
  });

  test('couleurs par thème : cyan en sombre, brique et cadran blanc en clair', async ({ page }) => {
    const couleurs = () =>
      page.evaluate(() => ({
        trotteuse: getComputedStyle(
          document.querySelector('[data-part="trotteuse"] [data-couleur="accent"]')!,
        ).stroke,
        cadran: getComputedStyle(document.querySelector('svg[data-etat] circle[r="112"]')!).fill,
      }));
    await page.goto('/');
    expect(await couleurs()).toEqual({ trotteuse: 'rgb(63, 224, 240)', cadran: 'rgb(18, 22, 27)' });
    await storeTheme(page, 'light');
    await page.reload();
    expect(await couleurs()).toEqual({
      trotteuse: 'rgb(184, 74, 59)',
      cadran: 'rgb(255, 255, 255)',
    });
  });
});

for (const [nom, viewport] of [
  ['mobile', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 900 }],
] as const) {
  test(`${nom} : le plus grand élément affiché (LCP) est l’accroche, pas la montre`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const element = await page.evaluate(
      () =>
        new Promise<string>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries() as (PerformanceEntry & { element?: Element })[];
            resolve(entries.at(-1)?.element?.id ?? 'inconnu');
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        }),
    );
    expect(element).toBe('accroche');
  });

  test(`${nom} : la page est la même avec ou sans JavaScript`, async ({ browser }) => {
    const capture = async (javaScriptEnabled: boolean) => {
      const context = await browser.newContext({ viewport, javaScriptEnabled });
      const page = await context.newPage();
      await page.goto('/');
      if (javaScriptEnabled) await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      // La montre est à l'heure réelle avec JS, en pose fixe sans : on la masque.
      const image = await page
        .locator('main')
        .screenshot({ mask: [page.locator('svg[data-etat]')] });
      await context.close();
      return image;
    };
    const { pixelsDifferents } = await comparerCaptures(
      browser,
      await capture(true),
      await capture(false),
    );
    expect(pixelsDifferents).toBe(0);
  });
}

test.describe('390 px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const chemin of ['/', '/mentions-legales/']) {
    test(`${chemin} : aucun débordement, cibles tactiles ≥ 44 px`, async ({ page }) => {
      await page.goto(chemin);
      const debordement = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(debordement).toBeLessThanOrEqual(0);
      const petites = await page.evaluate(() =>
        [...document.querySelectorAll('a, button')]
          .filter((e) => (e as HTMLElement).offsetParent !== null && !e.matches('.skip-link'))
          .map((e) => ({ texte: e.textContent?.trim(), r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.height < 44)
          .map(({ texte, r }) => `${texte} (${Math.round(r.height)} px)`),
      );
      expect(petites).toEqual([]);
    });
  }
});

test.describe('axe — mentions légales', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(theme, async ({ page }) => {
      await storeTheme(page, theme);
      await page.goto('/mentions-legales/');
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
});
