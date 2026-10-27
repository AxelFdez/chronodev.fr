import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { PREMIERE_VISITE } from './etat-initial';
import { hydrated, montreAuRepos, storeTheme } from './helpers';

// Tranche 5 : l'intro de première visite (BRIEF.md § Concept, MONTRE.md § Budget, C2).
test.use({ storageState: PREMIERE_VISITE });

const poussoir = (page: Page) => page.getByRole('button', { name: 'Démarrer la montre' });
const accroche = (page: Page) => page.getByRole('heading', { level: 1 });
// Pendant l'intro, le hero n'est masqué qu'à l'œil (opacité 0, le titre reste lu) :
// toBeVisible() ne le voit pas, on lit donc l'opacité réelle.
const opaciteHero = (page: Page) =>
  page.evaluate(
    () => getComputedStyle(document.querySelector('section[aria-labelledby="accroche"]')!).opacity,
  );
const heroAffiche = (page: Page, timeout = 5000) =>
  expect.poll(() => opaciteHero(page), { timeout, intervals: [50] }).toBe('1');
const heroQuiApparait = (page: Page, timeout: number) =>
  expect
    .poll(async () => Number(await opaciteHero(page)), { timeout, intervals: [50] })
    .toBeGreaterThan(0);
const passer = (page: Page) => page.getByRole('link', { name: 'Passer l’intro' });
const gsapPret = (page: Page) => page.locator('svg[data-gsap]').waitFor({ state: 'attached' });
const intro = (page: Page) => page.evaluate(() => document.documentElement.dataset.intro);

const pivot = (page: Page) =>
  page.evaluate(() => {
    const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
    const cap = document.querySelector('[data-part="aiguilles"] circle') as SVGCircleElement;
    const m = svg.getScreenCTM()!.inverse().multiply(cap.getScreenCTM()!);
    const p = new DOMPoint(cap.cx.baseVal.value, cap.cy.baseVal.value).matrixTransform(m);
    return { x: Math.round(p.x), y: Math.round(p.y) };
  });

test('première visite : la montre attend au centre, à l’état 1 ; le reste est masqué', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await hydrated(page);
  expect(await intro(page)).toBe('a-jouer');
  expect(await opaciteHero(page)).toBe('0');
  await expect(accroche(page)).toBeAttached(); // toujours lu par les lecteurs d'écran
  await expect(page.getByRole('link', { name: 'Parlons de votre projet' })).toHaveCount(0);
  await expect(page.getByText('Appuyez sur le poussoir', { exact: false })).toBeVisible();
  await expect(passer(page)).toBeVisible();
  await expect(poussoir(page)).toBeVisible();
  expect(await pivot(page)).toEqual({ x: 190, y: 290 }); // aiguilles au centre
  const montre = (await page.locator('svg[data-etat]').boundingBox())!;
  expect(Math.abs(montre.x + montre.width / 2 - 720)).toBeLessThan(2); // centrée
  // La barre du haut reste disponible pendant l'intro (décision « Toggle »).
  await expect(page.getByRole('button', { name: 'Thème clair' })).toBeVisible();
});

for (const [nom, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test(`${nom} : appui → hero en 2 s au plus, puis l’accent ; la montre finit à sa place`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await hydrated(page);
    await gsapPret(page);
    await poussoir(page).click();
    await page.waitForFunction(() => performance.getEntriesByName('intro:hero').length > 0);
    const duree = await page.evaluate(
      () => performance.measure('intro', 'intro:appui', 'intro:hero').duration,
    );
    expect(duree).toBeLessThanOrEqual(2000);
    await heroAffiche(page);
    await montreAuRepos(page);
    expect(await page.locator('svg[data-etat]').getAttribute('data-etat')).toBe('3');
    const finIntro = await page.locator('svg[data-etat]').boundingBox();

    // Deuxième visite : pas d'intro, et la montre à exactement la même place.
    await page.reload();
    await hydrated(page);
    expect(await intro(page)).toBe('vue');
    expect(await opaciteHero(page)).toBe('1');
    expect(await page.locator('svg[data-etat]').boundingBox()).toEqual(finIntro);
  });
}

test.describe('sorties : l’intro ne retient personne', () => {
  const sorties: [string, (page: Page) => Promise<void>][] = [
    ['lien « Passer l’intro »', (page) => passer(page).click()],
    ['Échap', (page) => page.keyboard.press('Escape')],
    ['molette', (page) => page.mouse.wheel(0, 300)],
  ];
  for (const [nom, sortir] of sorties) {
    test(nom, async ({ page }) => {
      await page.goto('/');
      await hydrated(page);
      await gsapPret(page);
      await page.mouse.move(400, 400);
      await sortir(page);
      await heroAffiche(page);
      expect(await intro(page)).toBe('vue');
      await montreAuRepos(page); // directement à l'état 3, sans animation
      expect(await page.locator('svg[data-etat]').getAttribute('data-etat')).toBe('3');
    });
  }
});

test('le lien « Passer l’intro » marche avant React', async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 4000));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await passer(page).click();
  await heroAffiche(page, 1000);
  const hydrate = await page.evaluate(() =>
    Object.keys(document.querySelector('button[aria-pressed]')!).some((k) =>
      k.startsWith('__react'),
    ),
  );
  expect(hydrate).toBe(false);
});

for (const retard of [300, 700, 1200]) {
  test(`appui avant React (JS retardé de ${retard} ms) : hero en 2 s au plus`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/_next/static/chunks/*.js', async (route) => {
      await new Promise((r) => setTimeout(r, retard));
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-poussoir]').click();
    // Appui noté par le script de <head> ; fin marquée par la montre, ou par le filet de 2 s.
    await page.waitForFunction(() => performance.getEntriesByName('intro:hero').length > 0);
    const duree = await page.evaluate(
      () =>
        performance.getEntriesByName('intro:hero')[0].startTime -
        (window as unknown as { __chronodev: { appui: number } }).__chronodev.appui,
    );
    expect(duree).toBeLessThanOrEqual(2000);
    await heroAffiche(page, 3000);
  });
}

test('React ne vient jamais : le filet de 2 s affiche le hero', async ({ page }) => {
  await page.route('**/_next/static/chunks/*.js', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const debut = Date.now();
  await page.locator('[data-poussoir]').click();
  await heroQuiApparait(page, 2500);
  expect(Date.now() - debut).toBeLessThanOrEqual(2500);
});

test('pendant l’intro, Tab ne mène qu’à ce qui est visible', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  const visites: string[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const { nom, visible } = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return {
        nom: el.getAttribute('aria-label') ?? el.textContent?.trim() ?? el.tagName,
        visible: el.checkVisibility({ visibilityProperty: true, opacityProperty: true }),
      };
    });
    expect(visible, `focus sur un élément masqué : ${nom}`).toBe(true);
    visites.push(nom);
  }
  expect(visites).toContain('Démarrer la montre');
  expect(visites).toContain('Passer l’intro');
});

test.describe('pas d’intro', () => {
  test.describe('sous mouvement réduit', () => {
    test.use({ reducedMotion: 'reduce' });
    test('le hero s’affiche tout de suite', async ({ page }) => {
      await page.goto('/');
      expect(await intro(page)).toBe('vue');
      expect(await opaciteHero(page)).toBe('1');
    });
  });

  test.describe('sans JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('le hero s’affiche, la consigne non', async ({ page }) => {
      await page.goto('/');
      expect(await opaciteHero(page)).toBe('1');
      await expect(page.getByText('Appuyez sur le poussoir', { exact: false })).toBeHidden();
    });
  });
});

test.describe('axe pendant l’intro', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(theme, async ({ page }) => {
      await storeTheme(page, theme);
      await page.goto('/');
      await hydrated(page);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
    });
  }
});
