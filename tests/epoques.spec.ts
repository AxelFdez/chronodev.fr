import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { comparerCaptures, hydrated, montreAuRepos, storeTheme } from './helpers';

// Tranche 3 : molette sans animation — époques, montre pilotée, grain, menu.

const NOMS = { avant: 'Avant', pendant: 'Pendant', apres: 'Après' } as const;
type Epoque = keyof typeof NOMS;

const radio = (page: Page, epoque: Epoque) => page.getByRole('radio', { name: NOMS[epoque] });
const panneau = (page: Page, epoque: Epoque) => page.locator(`[data-epoque="${epoque}"]`);
const etatMontre = (page: Page) => page.locator('svg[data-etat]').getAttribute('data-etat');

async function attendreEpoque(page: Page, epoque: Epoque, etat: string | null) {
  await expect(radio(page, epoque)).toBeChecked();
  for (const e of Object.keys(NOMS) as Epoque[]) {
    if (e === epoque) await expect(panneau(page, e)).toBeVisible();
    else await expect(panneau(page, e)).toBeHidden();
  }
  if (etat) expect(await etatMontre(page)).toBe(etat);
}

test('le texte des trois époques, des offres et de la preuve est dans la source', async ({
  request,
}) => {
  const html = await (await request.get('/')).text();
  for (const texte of [
    'Aujourd’hui, le temps joue contre vous.',
    'Le devis qui met trois semaines et reste flou.',
    'Les données recopiées à la main, chaque semaine.',
    'Pendant le projet, vous voyez le temps passer. Pas filer.',
    'le code, les accès et la documentation sont à vous.',
    'Ce que l’IA accélère',
    'La responsabilité du résultat',
    'Le temps joue pour vous.',
    '[OFFRE_NOM]',
    '[PRIX]',
    '[PREUVE_CLIENT]',
  ]) {
    expect(html, texte).toContain(texte);
  }
});

test('Après par défaut, et encore après un rechargement', async ({ page }) => {
  await page.goto('/');
  await hydrated(page);
  await attendreEpoque(page, 'apres', '3');
  await radio(page, 'avant').click();
  await attendreEpoque(page, 'avant', '1');
  await page.reload();
  await hydrated(page);
  await attendreEpoque(page, 'apres', '3');
});

test('clavier : Tab entre dans le groupe, les flèches changent d’époque, focus visible', async ({
  page,
}) => {
  await page.goto('/');
  await hydrated(page);
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => (document.activeElement as HTMLInputElement)?.name === 'epoque'))
      break;
  }
  await expect(radio(page, 'apres')).toBeFocused();
  const contour = await page
    .locator('label[for="epoque-apres"]')
    .evaluate((l) => getComputedStyle(l).outlineStyle);
  expect(contour).not.toBe('none');

  await page.keyboard.press('ArrowLeft');
  await attendreEpoque(page, 'pendant', '2');
  await page.keyboard.press('ArrowLeft');
  await attendreEpoque(page, 'avant', '1');
  await page.keyboard.press('ArrowRight');
  await attendreEpoque(page, 'pendant', '2');
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('les onglets changent de panneau ; la montre reste à l’état 3', async ({ page }) => {
    await page.goto('/');
    await radio(page, 'avant').click();
    await attendreEpoque(page, 'avant', '3');
    await radio(page, 'pendant').click();
    await attendreEpoque(page, 'pendant', '3');
  });
});

test('la couronne se glisse : à gauche on recule, à droite on avance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await hydrated(page);
  const box = (await page.locator('[data-part="couronne"]').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 45, y, { steps: 5 });
  await attendreEpoque(page, 'pendant', '2');
  await page.mouse.move(x - 100, y, { steps: 5 });
  await attendreEpoque(page, 'avant', '1');
  await page.mouse.up();

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 200, y, { steps: 5 });
  await page.mouse.up();
  await attendreEpoque(page, 'apres', '3');
});

test.describe('aucun accent avant l’époque 3 (MONTRE.md, DESIGN.md)', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(theme, async ({ page }) => {
      await storeTheme(page, theme);
      await page.goto('/');
      await hydrated(page);
      const accent = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
      );
      for (const epoque of ['avant', 'pendant'] as const) {
        await radio(page, epoque).click();
        await montreAuRepos(page);
        const fautes = await page.evaluate((accentHex) => {
          const probe = document.createElement('i');
          probe.style.color = accentHex;
          document.body.append(probe);
          const accentRgb = getComputedStyle(probe).color;
          probe.remove();
          const visible = (el: Element) => {
            for (let e: Element | null = el; e; e = e.parentElement) {
              const s = getComputedStyle(e);
              if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0)
                return false;
            }
            return true;
          };
          const fautes: string[] = [];
          // La montre : aucun trait ni aplat d'accent.
          for (const el of document.querySelectorAll('svg[data-etat] *')) {
            const s = getComputedStyle(el);
            if (visible(el) && (s.fill === accentRgb || s.stroke === accentRgb))
              fautes.push(`montre <${el.tagName}>`);
          }
          // La page : aucun texte en accent (il passerait sous 4.5:1 sur le grain en clair).
          for (const el of document.querySelectorAll('main *, header *')) {
            const texte = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim());
            if (texte && visible(el) && getComputedStyle(el).color === accentRgb)
              fautes.push(`texte « ${el.textContent!.trim().slice(0, 30)} »`);
          }
          return fautes;
        }, accent);
        expect(fautes, epoque).toEqual([]);
      }
    });
  }
});

test.describe('le grain se voit, plus en Avant qu’en Pendant, pas en Après', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(theme, async ({ page, browser }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await storeTheme(page, theme);
      await page.goto('/');
      await hydrated(page);
      await page.evaluate(() => document.fonts.ready);
      // Zone du hero : identique d'une époque à l'autre, sauf le grain.
      const zone = { x: 0, y: 120, width: 760, height: 360 };
      const capture = async (epoque: Epoque) => {
        await radio(page, epoque).click();
        // Le grain passe en fondu (1,2 s) : on attend son opacité finale.
        await page.waitForFunction((e) => {
          const grain = getComputedStyle(document.querySelector('main > div[aria-hidden]')!);
          const racine = getComputedStyle(document.documentElement);
          const cible = e === 'apres' ? '0' : racine.getPropertyValue(`--grain-${e}`).trim();
          return Number(grain.opacity) === Number(cible);
        }, epoque);
        await page.evaluate(() => window.scrollTo(0, 0));
        return page.screenshot({ clip: zone });
      };
      const apres = await capture('apres');
      const avant = (await comparerCaptures(browser, apres, await capture('avant'))).moyen;
      const pendant = (await comparerCaptures(browser, apres, await capture('pendant'))).moyen;
      expect(avant, 'Avant').toBeGreaterThan(1.5);
      expect(pendant, 'Pendant').toBeGreaterThan(0.5);
      expect(pendant).toBeLessThan(avant);
    });
  }
});

test.describe('390 px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('onglets et barre du haut : cibles ≥ 44 px, écarts ≥ 8 px', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const onglets = await Promise.all(
      (['avant', 'pendant', 'apres'] as const).map(
        async (e) => (await page.locator(`label[for="epoque-${e}"]`).boundingBox())!,
      ),
    );
    for (const o of onglets) expect(o.height).toBeGreaterThanOrEqual(44);
    for (let i = 1; i < onglets.length; i++)
      expect(onglets[i].x - (onglets[i - 1].x + onglets[i - 1].width)).toBeGreaterThanOrEqual(8);

    const menu = (await page.getByText('Menu', { exact: true }).boundingBox())!;
    const poussoir = (await page.getByRole('button', { name: 'Thème clair' }).boundingBox())!;
    expect(menu.height).toBeGreaterThanOrEqual(44);
    expect(poussoir.x - (menu.x + menu.width)).toBeGreaterThanOrEqual(8);
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debordement).toBeLessThanOrEqual(0);
  });
});

test.describe('Menu', () => {
  test('s’ouvre, se ferme par Échap (focus rendu), bascule le thème en mots', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const resume = page.getByText('Menu', { exact: true });
    await resume.click();
    const nav = page.getByRole('navigation', { name: 'Menu' });
    await expect(nav.getByRole('link', { name: 'Contact' })).toBeVisible();
    for (const item of await nav.locator('a, button').all()) {
      expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(resume).toBeFocused();

    await resume.click();
    await nav.getByRole('button', { name: 'Passer en thème clair' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(nav.getByRole('button', { name: 'Passer en thème sombre' })).toBeVisible();
    await page.mouse.click(5, 400);
    await expect(nav).toBeHidden();
  });

  test.describe('sans JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('s’ouvre quand même ; l’entrée de thème est masquée', async ({ page }) => {
      await page.goto('/');
      await page.getByText('Menu', { exact: true }).click();
      const nav = page.getByRole('navigation', { name: 'Menu' });
      await expect(nav.getByRole('link', { name: 'Mentions légales' })).toBeVisible();
      await expect(nav.getByRole('button')).toBeHidden();
    });
  });
});

test.describe('axe — trois époques × deux thèmes', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const epoque of ['avant', 'pendant', 'apres'] as const) {
      test(`${theme}, ${epoque}`, async ({ page }) => {
        await storeTheme(page, theme);
        await page.goto('/');
        await hydrated(page);
        await radio(page, epoque).click();
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  }
});
