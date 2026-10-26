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
