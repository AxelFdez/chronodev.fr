import { test } from '@playwright/test';
import { allerAEpoque, DIX_HEURES, hydrated, montreAuRepos, storeTheme } from './helpers';
import { INTRO_VUE, PREMIERE_VISITE } from './etat-initial';

// Captures à LIRE avant de conclure une tranche : artifacts/screens/.
// Sans JavaScript, le thème clair est impossible (il dépend du script) : seul le sombre existe.
const viewports = { mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } };
const cases = [
  ...(['dark', 'light'] as const).flatMap((theme) =>
    (['no-preference', 'reduce'] as const).map((motion) => ({ theme, motion, js: true })),
  ),
  ...(['no-preference', 'reduce'] as const).map((motion) => ({
    theme: 'dark' as const,
    motion,
    js: false,
  })),
];

for (const [name, viewport] of Object.entries(viewports)) {
  for (const { theme, motion, js } of cases) {
    const id = `${name}-${theme}-${motion === 'reduce' ? 'reduit' : 'normal'}-${js ? 'js' : 'sans-js'}`;
    test(`capture ${id}`, async ({ browser }) => {
      const context = await browser.newContext({
        storageState: INTRO_VUE,
        viewport,
        reducedMotion: motion,
        javaScriptEnabled: js,
      });
      const page = await context.newPage();
      if (js) await storeTheme(page, theme);
      await page.clock.setFixedTime(DIX_HEURES); // captures reproductibles
      for (const [chemin, nom] of [
        ['/', 'accueil'],
        ['/mentions-legales/', 'mentions'],
      ]) {
        await page.goto(chemin);
        if (js) await hydrated(page);
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: `artifacts/screens/${nom}-${id}.png`, fullPage: true });
      }
      await context.close();
    });
  }
}

// Avant et Pendant, cadrées sur leur section (la montre la suit sur desktop).
for (const [name, viewport] of Object.entries(viewports)) {
  for (const theme of ['dark', 'light'] as const) {
    for (const epoque of ['avant', 'pendant'] as const) {
      test(`capture ${name}-${theme}-${epoque}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport, storageState: INTRO_VUE });
        const page = await context.newPage();
        await storeTheme(page, theme);
        // GSAP lit Date.now() : l'horloge doit avancer pendant l'animation, puis on la fige
        // à une heure connue pour une capture reproductible.
        await page.clock.install({ time: DIX_HEURES });
        await page.goto('/');
        await hydrated(page);
        await page.evaluate(() => document.fonts.ready);
        await allerAEpoque(page, epoque);
        await montreAuRepos(page);
        await page.clock.pauseAt(new Date(DIX_HEURES.getTime() + 60_000));
        await page.screenshot({ path: `artifacts/screens/epoque-${name}-${theme}-${epoque}.png` });
        await context.close();
      });
    }
  }
  test(`capture ${name}-dark-avant-sans-js`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport,
      javaScriptEnabled: false,
      storageState: INTRO_VUE,
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#epoque-avant').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `artifacts/screens/epoque-${name}-dark-avant-sans-js.png` });
    await context.close();
  });
}

// L'intro de première visite, avant l'appui.
for (const [name, viewport] of Object.entries(viewports)) {
  for (const theme of ['dark', 'light'] as const) {
    test(`capture intro ${name}-${theme}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, storageState: PREMIERE_VISITE });
      const page = await context.newPage();
      await storeTheme(page, theme);
      await page.clock.setFixedTime(DIX_HEURES);
      await page.goto('/');
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      await page.locator('svg[data-gsap]').waitFor({ state: 'attached' });
      await page.screenshot({ path: `artifacts/screens/intro-${name}-${theme}.png` });
      await context.close();
    });
  }
}

// Le module « Dernière veille » affiché (entrée d'essai), dans l'époque Après.
for (const [name, viewport] of Object.entries(viewports)) {
  for (const theme of ['dark', 'light'] as const) {
    test(`capture veille ${name}-${theme}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport, storageState: INTRO_VUE });
      const page = await context.newPage();
      await storeTheme(page, theme);
      await page.clock.setFixedTime(new Date('2026-10-26T12:00:00Z'));
      await page.route('**/veille/derniere.json', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            version: 1,
            entree: {
              date: '2026-10-20',
              titre: 'Titre d’essai',
              resume: 'Résumé d’essai, en texte brut, pour vérifier la mise en page.',
              source: { nom: 'Source d’essai', url: 'https://exemple.org/article' },
              validee: { par: 'Axel', le: '2026-10-21T08:00:00Z' },
            },
          }),
        }),
      );
      await page.goto('/');
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      const bloc = page.locator('section[aria-labelledby="veille-titre"]');
      await bloc.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      // Le module apparaît en fondu (250 ms) : on capture une fois l'animation finie.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      );
      await page.screenshot({ path: `artifacts/screens/veille-${name}-${theme}.png` });
      await context.close();
    });
  }
}
