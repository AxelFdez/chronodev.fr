import { expect, test, type Page } from '@playwright/test';
import {
  allerAEpoque,
  angle,
  animationsInterdites,
  DIX_HEURES,
  type Epoque,
  hydrated,
  MIDI,
  montreAuRepos,
  valeurDuPremierFrame,
} from './helpers';

// Tranche 4 : montre animée — heure réelle, chrono, timeline des époques.
// À 10 h 08 min 30 s : heures 304°, minutes 51°, trotteuse 180°, jour/nuit -62°.

const chrono = (page: Page) => page.getByRole('button', { name: 'Arrêter le chrono' });

test('à l’heure dès le premier frame, avant React', async ({ page }) => {
  await page.clock.setFixedTime(DIX_HEURES);
  await page.route('**/_next/static/chunks/**', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  // Premier frame où la montre existe (le rendu est progressif : les premiers frames
  // peuvent précéder son analyse). Elle doit déjà y être à l'heure.
  await page.addInitScript(() => {
    const observer = () => {
      if (!document.querySelector('svg[data-etat]')) return requestAnimationFrame(observer);
      const lire = (a: string) =>
        document.querySelector(`[data-aiguille="${a}"]`)?.getAttribute('transform');
      (window as unknown as { __premier: object }).__premier = {
        heures: lire('heures'),
        minutes: lire('minutes'),
        secondes: lire('secondes'),
        jourNuit: lire('jour-nuit'),
        reactCharge: Object.keys(document.querySelector('svg[data-etat]')!).some((k) =>
          k.startsWith('__react'),
        ),
      };
    };
    requestAnimationFrame(observer);
  });
  await page.goto('/');
  const premier = await valeurDuPremierFrame(page, '__premier');
  expect(premier).toEqual({
    heures: 'rotate(304 190 290)',
    minutes: 'rotate(51 190 290)',
    secondes: 'rotate(180 190 290)',
    jourNuit: 'rotate(-62 190 228)',
    reactCharge: false,
  });
});

test('la trotteuse avance d’un pas par seconde, les minutes suivent', async ({ page }) => {
  await page.clock.install({ time: DIX_HEURES });
  await page.goto('/');
  await hydrated(page);
  expect(await angle(page, 'secondes')).toBe(180);
  await page.clock.runFor(1000);
  expect(await angle(page, 'secondes')).toBe(186);
  await page.clock.runFor(29_000); // 10 h 09 min 00 s
  expect(await angle(page, 'secondes')).toBe(0);
  expect(await angle(page, 'minutes')).toBe(54);
});

test('jour/nuit suit l’heure locale : moitié pleine en haut à midi, en bas à minuit', async ({
  page,
}) => {
  await page.clock.setFixedTime(MIDI);
  await page.goto('/');
  expect(await angle(page, 'jour-nuit')).toBe(-90);
  await page.clock.setFixedTime(new Date('2026-10-26T00:00:00'));
  await page.reload();
  expect(await angle(page, 'jour-nuit')).toBe(90);
});

test('chrono : le poussoir l’arrête et le relance (WCAG 2.2.2)', async ({ page }) => {
  await page.clock.install({ time: DIX_HEURES });
  await page.goto('/');
  await hydrated(page);
  await expect(chrono(page)).toHaveAttribute('aria-pressed', 'false');

  await chrono(page).click();
  await expect(chrono(page)).toHaveAttribute('aria-pressed', 'true');
  const figee = await angle(page, 'secondes');
  // Arrêté, le minuteur ne repasse qu'à la minute : on la franchit pour que le test morde.
  await page.clock.runFor(61_000);
  expect(await angle(page, 'secondes')).toBe(figee);

  await chrono(page).click();
  await expect(chrono(page)).toHaveAttribute('aria-pressed', 'false');
  await page.clock.runFor(1000);
  // Relancée, la trotteuse reprend l'heure réelle.
  const s = new Date(await page.evaluate(() => Date.now())).getSeconds();
  expect(await angle(page, 'secondes')).toBe(s * 6);
});

test('le poussoir chrono est une cible tactile ≥ 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await hydrated(page);
  const box = (await chrono(page).boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});

test.describe('prefers-reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('chrono au repos, trotteuse à 0, époques sans interpolation, aucune animation', async ({
    page,
  }) => {
    await page.clock.install({ time: DIX_HEURES });
    await page.goto('/');
    await hydrated(page);
    expect(await angle(page, 'secondes')).toBe(0);
    await expect(chrono(page)).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(5000);
    expect(await angle(page, 'secondes')).toBe(0);

    await allerAEpoque(page, 'avant');
    // Aucune interpolation : l'état cible est posé tout de suite.
    const svg = page.locator('svg[data-etat]');
    await expect(svg).toHaveAttribute('data-etat', '1');
    expect(await svg.evaluate((s) => s.style.getPropertyValue('--w-p2'))).toBe('0');
    expect(await svg.getAttribute('data-anime')).toBeNull();
    expect(await svg.getAttribute('data-gsap')).toBeNull(); // GSAP n'est même pas chargé
    expect(await animationsInterdites(page)).toEqual([]);

    // Le visiteur peut relancer le chrono lui-même : la trotteuse reprend l'heure réelle.
    await chrono(page).click();
    await expect(chrono(page)).toHaveAttribute('aria-pressed', 'false');
    await page.clock.runFor(1000);
    const s = new Date(await page.evaluate(() => Date.now())).getSeconds();
    expect(s).not.toBe(0);
    expect(await angle(page, 'secondes')).toBe(s * 6);
  });
});

test.describe('timeline des époques', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  /** Durée d'un changement d'époque, mesurée dans la page. */
  async function changer(page: Page, epoque: Epoque) {
    const debut = await page.evaluate(() => performance.now());
    await allerAEpoque(page, epoque);
    await page.locator('svg[data-anime]').waitFor({ state: 'attached' });
    await montreAuRepos(page);
    return (await page.evaluate(() => performance.now())) - debut;
  }

  const pivot = (page: Page) =>
    page.evaluate(() => {
      const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
      const cap = document.querySelector('[data-part="aiguilles"] circle') as SVGCircleElement;
      const m = svg.getScreenCTM()!.inverse().multiply(cap.getScreenCTM()!);
      const p = new DOMPoint(cap.cx.baseVal.value, cap.cy.baseVal.value).matrixTransform(m);
      return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
    });

  test('1,2 à 2 s par changement ; les aiguilles migrent de (190, 290) à (190, 352)', async ({
    page,
  }) => {
    await page.goto('/');
    await hydrated(page);
    await page.locator('svg[data-gsap]').waitFor({ state: 'attached' });
    expect(await pivot(page)).toEqual({ x: 190, y: 352 });

    const versPendant = await changer(page, 'pendant');
    expect(versPendant).toBeGreaterThanOrEqual(1150);
    expect(versPendant).toBeLessThanOrEqual(2300);
    expect(await pivot(page)).toEqual({ x: 190, y: 352 });

    const versAvant = await changer(page, 'avant');
    expect(versAvant).toBeGreaterThanOrEqual(1150);
    expect(versAvant).toBeLessThanOrEqual(2300);
    expect(await pivot(page)).toEqual({ x: 190, y: 290 });

    const versApres = await changer(page, 'apres'); // la plus longue distance : 2 s
    expect(versApres).toBeGreaterThanOrEqual(1800);
    expect(versApres).toBeLessThanOrEqual(2500);
    expect(await pivot(page)).toEqual({ x: 190, y: 352 });
  });

  test('à mi-migration, les aiguilles restent au-dessus du cadran (S1)', async ({ page }) => {
    // Horloge pilotée : l'échantillon tombe au même instant de la migration quelle que soit la
    // charge. Un délai réel tombait en fin de migration sur une machine chargée : le chapeau y
    // passe sous l'axe (r 7 au centre), au-dessus de tout par conception.
    await page.clock.install({ time: DIX_HEURES });
    await page.goto('/');
    await hydrated(page);
    await page.locator('svg[data-gsap]').waitFor({ state: 'attached' });
    await allerAEpoque(page, 'pendant');
    await montreAuRepos(page);
    // 10 h 09 min 15 s : la trotteuse pointe à 3 h, hors du trajet vertical des aiguilles (à
    // 30 s, elle le recouvrait et masquait tout ce qui passe dessous). Toujours dans le futur :
    // un test dure moins de 30 s.
    await page.clock.pauseAt(new Date(DIX_HEURES.getTime() + 45_000));
    await allerAEpoque(page, 'avant');
    // La migration occupe environ 450 à 750 ms du changement Pendant → Avant (1,2 s).
    await page.clock.runFor(600);
    const { echelle, dessus } = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-etat]') as SVGSVGElement;
      const g = document.querySelector('[data-part="aiguilles"]') as SVGGElement;
      const r = g.querySelector('circle')!.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)!;
      return {
        echelle: svg.getScreenCTM()!.inverse().multiply(g.getScreenCTM()!).a,
        dessus: el.closest('[data-part]')?.getAttribute('data-part') ?? el.tagName,
      };
    });
    // Bien à mi-chemin entre 0,35 (sous-cadran) et 1 (centre).
    expect(echelle).toBeGreaterThan(0.45);
    expect(echelle).toBeLessThan(0.85);
    expect(dessus).toBe('aiguilles');
  });
});
