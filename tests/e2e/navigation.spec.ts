import { expect, test } from '@playwright/test';
import { content } from '../../src/content/index';
import { IDS, isMobile, link, mainNav, openMap, press, sheet, sheetPanel } from './helpers';

test.describe('Accueil et navigation générale', () => {
  test('C01 — l’accueil présente l’app et mène aux cours, à la mindmap et à la progression', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Archi Map' })).toBeVisible();
    await expect(page.getByTestId('presentation')).toBeVisible();
    await expect(
      page.getByText(`${content.concepts.length} concepts, ${content.sectors.length} secteurs`),
    ).toBeVisible();

    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Ma progression' })).toBeVisible();

    await press(main.getByRole('link', { name: 'Liste des cours' }), testInfo);
    await expect(page).toHaveURL('/cours');

    await page.goto('/');
    await press(page.getByRole('main').getByRole('link', { name: 'Voir la mindmap' }), testInfo);
    await expect(page).toHaveURL('/carte');
    await expect(page.locator('.react-flow__viewport')).toBeVisible();
  });

  const pages = [
    ['Accueil', '/'],
    ['Cours', '/cours'],
    ['Mindmap', '/carte'],
    ['Comparer', '/comparer'],
    ['Progression', '/progression'],
  ] as const;

  test('C02 — la barre de navigation est présente sur toutes les pages et mène à chacune', async ({ page }, testInfo) => {
    for (const [, url] of pages) {
      await page.goto(url);
      const nav = mainNav(page);
      await expect(nav).toBeVisible();
      for (const [name] of pages) await expect(nav.getByRole('link', { name })).toBeVisible();
      await expect(nav.getByRole('button', { name: /thème/i })).toBeVisible();
    }
    await page.goto('/');
    for (const [name, url] of pages) {
      await press(mainNav(page).getByRole('link', { name }), testInfo);
      await expect(page).toHaveURL(url);
    }
  });

  test('C02 — sur mobile, la barre est en bas et ne masque pas la fin du contenu', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    await page.goto('/cours');
    const nav = await mainNav(page).boundingBox();
    expect(nav!.y + nav!.height).toBeGreaterThan(844 - 10);
    expect(nav!.y).toBeGreaterThan(844 / 2);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const lastCard = page.getByRole('main').getByRole('article').last();
    const card = await lastCard.boundingBox();
    const navAfter = await mainNav(page).boundingBox();
    expect(card!.y + card!.height).toBeLessThanOrEqual(navAfter!.y);
  });

  test('C03 — la page en cours est indiquée dans la barre de navigation', async ({ page }) => {
    for (const [name, url] of pages) {
      await page.goto(url);
      await expect(mainNav(page).getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
      const others = pages.filter(([n]) => n !== name);
      for (const [other] of others) {
        await expect(mainNav(page).getByRole('link', { name: other })).not.toHaveAttribute('aria-current', 'page');
      }
    }
  });

  test('C04 — chaque URL ouverte directement affiche la bonne page', async ({ page }) => {
    const concept = sheet(IDS.concept);
    const l = link(IDS.link);

    await page.goto('/cours');
    await expect(page.getByRole('heading', { level: 1, name: 'Cours' })).toBeVisible();

    await page.goto(`/cours/${concept.id}`);
    await expect(page.getByRole('heading', { level: 1, name: concept.title })).toBeVisible();

    await page.goto(`/liens/${l.id}`);
    await expect(page.getByRole('heading', { level: 1, name: l.title })).toBeVisible();

    await openMap(page, `/carte/${concept.id}`);
    await expect(sheetPanel(page, concept.title)).toBeVisible();

    await openMap(page, `/carte/liens/${l.id}`);
    await expect(sheetPanel(page, l.title)).toBeVisible();

    await page.goto('/progression');
    await expect(page.getByRole('heading', { level: 1, name: 'Ma progression' })).toBeVisible();

    await page.goto('/comparer/cqrs/event-sourcing');
    await expect(page.getByRole('heading', { level: 1, name: /Comparer/ })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /Comparer/ })).toBeVisible();
  });

  test('C05 — « retour » ferme le panneau de la carte puis revient à la page précédente', async ({ page }, testInfo) => {
    const concept = sheet(IDS.concept);
    await page.goto('/');
    await press(page.getByRole('main').getByRole('link', { name: 'Voir la mindmap' }), testInfo);
    await openMap(page, '/carte');
    await press(page.locator(`[data-node-id="${concept.id}"]`), testInfo);
    await expect(page).toHaveURL(`/carte/${concept.id}`);
    await expect(sheetPanel(page, concept.title)).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL('/carte');
    await expect(sheetPanel(page, concept.title)).toBeHidden();

    await page.goBack();
    await expect(page).toHaveURL('/');
  });

  test('C05 — « retour » depuis une fiche en pleine page revient à la liste des cours', async ({ page }, testInfo) => {
    await page.goto('/cours');
    await press(page.getByRole('link', { name: new RegExp(sheet(IDS.concept).title) }).first(), testInfo);
    await expect(page).toHaveURL(`/cours/${IDS.concept}`);
    await page.goBack();
    await expect(page).toHaveURL('/cours');
  });

  for (const url of ['/nimporte-quoi', '/cours/fiche-inexistante', '/liens/lien-inexistant', '/carte/noeud-inexistant']) {
    test(`C06 — ${url} affiche « Introuvable » avec des liens de sortie`, async ({ page }) => {
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1, name: 'Introuvable' })).toBeVisible();
      const main = page.getByRole('main');
      await expect(main.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/');
      await expect(main.getByRole('link', { name: 'Cours' })).toHaveAttribute('href', '/cours');
      await expect(main.getByRole('link', { name: 'Mindmap' })).toHaveAttribute('href', '/carte');
    });
  }
});
