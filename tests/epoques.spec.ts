import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  allerAEpoque,
  comparerCaptures,
  type Epoque,
  hydrated,
  montreAuRepos,
  storeTheme,
} from './helpers';

// Les époques en sections à la suite (PLAN.md § T8) : Avant, Pendant et Après se
// lisent en défilant. La section sur la ligne de lecture donne l'état de la montre et le grain.

const NOMS = { avant: 'Avant', pendant: 'Pendant', apres: 'Après' } as const;
const ETATS = { avant: '1', pendant: '2', apres: '3' } as const;

const repere = (page: Page) => page.getByRole('navigation', { name: 'Étapes de votre projet' });
const etape = (page: Page, epoque: Epoque) =>
  repere(page).getByRole('link', { name: NOMS[epoque] });
const montre = (page: Page) => page.locator('svg[data-etat]');

/** L'époque à l'écran (ou aucune), l'étape marquée dans le repère et l'état de la montre. */
async function attendreEpoque(page: Page, epoque: Epoque | null) {
  const html = page.locator('html');
  if (epoque) await expect(html).toHaveAttribute('data-epoque-courante', epoque);
  else await expect(html).not.toHaveAttribute('data-epoque-courante');
  for (const e of Object.keys(NOMS) as Epoque[]) {
    if (e === epoque) await expect(etape(page, e)).toHaveAttribute('aria-current', 'step');
    else await expect(etape(page, e)).not.toHaveAttribute('aria-current');
  }
  await expect(montre(page)).toHaveAttribute('data-etat', epoque ? ETATS[epoque] : '3');
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
    'Ce qui reste humain',
    'la responsabilité du résultat',
    'Le temps joue pour vous.',
    '[OFFRE_NOM]',
    '[PRIX]',
    '[PREUVE_CLIENT]',
  ]) {
    expect(html, texte).toContain(texte);
  }
});

test('dans l’ordre de lecture : le problème, la méthode, puis l’offre', async ({ page }) => {
  await page.goto('/');
  const ordre = await page
    .locator('section[data-epoque]')
    .evaluateAll((s) => s.map((e) => (e as HTMLElement).dataset.epoque));
  expect(ordre).toEqual(['avant', 'pendant', 'apres']);
});

test('en défilant : montre complète dans le hero, puis 1, 2, 3 ; Après sous la dernière section', async ({
  page,
}) => {
  await page.goto('/');
  await hydrated(page);
  await attendreEpoque(page, null);
  for (const epoque of ['avant', 'pendant', 'apres'] as const) {
    await allerAEpoque(page, epoque);
    await attendreEpoque(page, epoque);
  }
  await page.locator('#contact').evaluate((c) => c.scrollIntoView({ block: 'end' }));
  await attendreEpoque(page, 'apres');
  await page.evaluate(() => window.scrollTo(0, 0));
  await attendreEpoque(page, null);
});

test('clavier : le repère est fait de liens, Entrée mène à la section, focus visible', async ({
  page,
}) => {
  await page.goto('/');
  await hydrated(page);
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    if (await etape(page, 'avant').evaluate((a) => a === document.activeElement)) break;
  }
  await expect(etape(page, 'avant')).toBeFocused();
  const contour = await etape(page, 'avant').evaluate((a) => getComputedStyle(a).outlineStyle);
  expect(contour).not.toBe('none');

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#epoque-avant$/);
  await attendreEpoque(page, 'avant');
  await etape(page, 'apres').focus();
  await page.keyboard.press('Enter');
  await attendreEpoque(page, 'apres');
});

test('grand écran : le repère marque l’étape qu’il vient d’amener en haut, pas la suivante', async ({
  page,
}) => {
  // Une section courte amenée en haut ne descend pas jusqu'au milieu d'un écran haut : la
  // ligne de lecture doit être plus haute (30 %), sinon le repère marquerait la suivante.
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto('/');
  await hydrated(page);
  for (const epoque of ['avant', 'pendant', 'apres'] as const) {
    await etape(page, epoque).click();
    await attendreEpoque(page, epoque);
  }
});

test('écran bas (téléphone en paysage) : au contact, Après reste l’étape marquée', async ({
  page,
}) => {
  // Le contact et le pied de page dépassent la ligne de lecture : aucune section ne la
  // croise plus, et c'est le repli « sous la dernière section » qui garde Après.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await hydrated(page);
  // Le premier rappel de l'observateur est passé (deux frames) : le saut est un vrai saut.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await attendreEpoque(page, 'apres');
});

test.describe('sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('les trois époques sont visibles, le repère y mène, la montre reste à l’état 3', async ({
    page,
  }) => {
    await page.goto('/');
    for (const epoque of ['avant', 'pendant', 'apres'] as const) {
      await expect(page.locator(`#epoque-${epoque}`)).toBeVisible();
    }
    await etape(page, 'pendant').click();
    await expect(page).toHaveURL(/#epoque-pendant$/);
    await expect(montre(page)).toHaveAttribute('data-etat', '3');
  });
});

test('la couronne se glisse : à gauche on recule, à droite on avance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await hydrated(page);
  const box = (await page.locator('[data-part="couronne"]').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  // Depuis le hero (montre complète) : un cran à gauche mène à Pendant, deux à Avant.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 45, y, { steps: 5 });
  await attendreEpoque(page, 'pendant');
  await page.mouse.move(x - 100, y, { steps: 5 });
  await attendreEpoque(page, 'avant');
  await page.mouse.up();

  // La montre est collante : la couronne n'a pas bougé.
  const apres = (await page.locator('[data-part="couronne"]').boundingBox())!;
  await page.mouse.move(apres.x + apres.width / 2, apres.y + apres.height / 2);
  await page.mouse.down();
  await page.mouse.move(apres.x + apres.width / 2 + 200, apres.y + apres.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  await attendreEpoque(page, 'apres');
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
        await allerAEpoque(page, epoque);
        await montreAuRepos(page);
        const fautes = await page.evaluate(
          ([accentHex, epoque]) => {
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
            // La section : aucun texte en accent (il passerait sous 4.5:1 sur le grain en clair).
            for (const el of document.querySelectorAll(`#epoque-${epoque} *`)) {
              const texte = [...el.childNodes].some(
                (n) => n.nodeType === 3 && n.textContent!.trim(),
              );
              if (texte && visible(el) && getComputedStyle(el).color === accentRgb)
                fautes.push(`texte « ${el.textContent!.trim().slice(0, 30)} »`);
            }
            return fautes;
          },
          [accent, epoque],
        );
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
      // Sous la montre collante, la colonne de droite n'a que le fond : seul le grain y change.
      const zone = { x: 960, y: 560, width: 440, height: 300 };
      const capture = async (epoque: Epoque) => {
        await allerAEpoque(page, epoque);
        // Le grain passe en fondu (1,2 s) : on attend son opacité finale.
        await page.waitForFunction((e) => {
          const grain = getComputedStyle(document.querySelector('main > div[aria-hidden]')!);
          const racine = getComputedStyle(document.documentElement);
          const cible = e === 'apres' ? '0' : racine.getPropertyValue(`--grain-${e}`).trim();
          return Number(grain.opacity) === Number(cible);
        }, epoque);
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

  test('repère et barre du haut : cibles ≥ 44 px, écarts ≥ 8 px', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    const etapes = await Promise.all(
      (['avant', 'pendant', 'apres'] as const).map(
        async (e) => (await etape(page, e).boundingBox())!,
      ),
    );
    for (const o of etapes) expect(o.height).toBeGreaterThanOrEqual(44);
    for (let i = 1; i < etapes.length; i++)
      expect(etapes[i].x - (etapes[i - 1].x + etapes[i - 1].width)).toBeGreaterThanOrEqual(8);

    const menu = (await page.getByText('Menu', { exact: true }).boundingBox())!;
    const poussoir = (await page.getByRole('button', { name: 'Thème clair' }).boundingBox())!;
    expect(menu.height).toBeGreaterThanOrEqual(44);
    expect(poussoir.x - (menu.x + menu.width)).toBeGreaterThanOrEqual(8);
    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(debordement).toBeLessThanOrEqual(0);
  });

  test('le repère reste visible en haut de l’écran pendant la lecture', async ({ page }) => {
    await page.goto('/');
    await hydrated(page);
    await allerAEpoque(page, 'pendant');
    await page.mouse.wheel(0, 300);
    await expect(page.locator('html')).toHaveAttribute('data-epoque-courante', /pendant|apres/);
    const haut = (await repere(page).boundingBox())!.y;
    expect(haut).toBeGreaterThanOrEqual(0);
    expect(haut).toBeLessThanOrEqual(1);
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
        await allerAEpoque(page, epoque);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .analyze();
        expect(violations.map((v) => `${v.id} : ${v.help} (${v.nodes.length})`)).toEqual([]);
      });
    }
  }
});
