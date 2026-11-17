import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { IDS, isMobile, link, linkLabel, mainNav, mapNode, openMap, press, seedProgress, sheet, sheetPanel } from './helpers';

const themeButton = (page: Page) => mainNav(page).getByRole('button', { name: /thème/i });

test.describe('Thème', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`C58 — sans choix, le thème suit l’appareil (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
    });
  }

  test('C58 — le bouton force le thème, le choix est mémorisé et prime sur l’appareil', async ({ page }, testInfo) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await press(themeButton(page), testInfo);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(themeButton(page)).toHaveAccessibleName('Passer au thème clair');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await press(themeButton(page), testInfo);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('C58 — le fond de page change vraiment de couleur', async ({ page }) => {
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const light = await bg();
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    expect(await bg()).not.toBe(light);
  });
});

test.describe('Contrastes (WCAG AA)', () => {
  const pages = [
    ['accueil', '/'],
    ['liste des cours', '/cours'],
    ['carte', '/carte'],
    ['fiche concept', `/cours/${IDS.concept}`],
    ['fiche secteur', `/cours/${IDS.sector}`],
    ['page de lien', `/liens/${IDS.link}`],
    ['progression', '/progression'],
    ['comparateur', '/comparer/cqrs/event-sourcing'],
  ] as const;

  for (const scheme of ['light', 'dark'] as const) {
    for (const [name, url] of pages) {
      test(`C59 — ${name} en thème ${scheme === 'light' ? 'clair' : 'sombre'} : aucune violation axe-core`, async ({ page }) => {
        await seedProgress(page, { read: [IDS.concept] }); // fait apparaître les coches
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto(url);
        await page.getByRole('main').waitFor();
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      });
    }
  }
});

test.describe('Clavier et noms accessibles', () => {
  test('C60 — Tab atteint les nœuds et les liens, Entrée ouvre, Échap ferme et rend le focus', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'ordinateur uniquement');
    await openMap(page);
    const target = mapNode(page, IDS.concept);

    let reached = false;
    for (let i = 0; i < 200 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
    }
    expect(reached, 'le nœud doit être atteignable au clavier').toBe(true);

    // focus visible : contour non nul
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    });
    expect(outline).toBe(true);

    await page.keyboard.press('Enter');
    const panel = sheetPanel(page, sheet(IDS.concept).title);
    await expect(panel).toBeVisible();
    // le focus passe dans le panneau
    expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(target).toBeFocused();
  });

  test('C60 — les étiquettes de lien sont atteignables au clavier', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'ordinateur uniquement');
    await openMap(page);
    const label = linkLabel(page, IDS.link);
    let reached = false;
    for (let i = 0; i < 300 && !reached; i++) {
      await page.keyboard.press('Tab');
      reached = await label.evaluate((el) => el === document.activeElement);
    }
    expect(reached).toBe(true);
    await page.keyboard.press('Enter');
    await expect(sheetPanel(page, link(IDS.link).title)).toBeVisible();
  });

  test('C61 — nœuds et liens ont un nom accessible explicite', async ({ page }, testInfo) => {
    await seedProgress(page, { read: [IDS.concept] });
    // Sur mobile, seules les étiquettes des liens du nœud au centre sont affichées (C25)
    await openMap(page, isMobile(testInfo) ? `/carte/${link(IDS.link).target}` : '/carte');
    await expect(mapNode(page, IDS.concept)).toHaveAccessibleName(`${sheet(IDS.concept).title}, concept, lu`);
    await expect(mapNode(page, IDS.sector)).toHaveAccessibleName(`${sheet(IDS.sector).title}, secteur, non lu`);
    await expect(mapNode(page, 'concepts')).toHaveAccessibleName(/^Concepts, branche/);
    await expect(linkLabel(page, IDS.link)).toHaveAccessibleName(`Lien : ${link(IDS.link).title}`);
  });
});
