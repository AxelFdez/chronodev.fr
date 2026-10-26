import { test } from '@playwright/test';
import { hydrated, storeTheme } from './helpers';

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
        viewport,
        reducedMotion: motion,
        javaScriptEnabled: js,
      });
      const page = await context.newPage();
      if (js) await storeTheme(page, theme);
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

// Les deux autres époques, cadrées sur leur section (la montre la suit sur desktop).
const NOMS = { avant: 'Avant', pendant: 'Pendant' } as const;
for (const [name, viewport] of Object.entries(viewports)) {
  for (const theme of ['dark', 'light'] as const) {
    for (const epoque of ['avant', 'pendant'] as const) {
      test(`capture ${name}-${theme}-${epoque}`, async ({ browser }) => {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        await storeTheme(page, theme);
        await page.goto('/');
        await hydrated(page);
        await page.evaluate(() => document.fonts.ready);
        await page.getByRole('radio', { name: NOMS[epoque] }).click();
        await page.locator('#epoques').evaluate((e) => e.scrollIntoView({ block: 'start' }));
        await page.screenshot({ path: `artifacts/screens/epoque-${name}-${theme}-${epoque}.png` });
        await context.close();
      });
    }
  }
  test(`capture ${name}-dark-avant-sans-js`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('radio', { name: 'Avant' }).click();
    await page.locator('#epoques').evaluate((e) => e.scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `artifacts/screens/epoque-${name}-dark-avant-sans-js.png` });
    await context.close();
  });
}
