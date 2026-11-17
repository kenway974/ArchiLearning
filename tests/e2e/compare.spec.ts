import { expect, test, type Page } from '@playwright/test';
import { content } from '../../src/content/index';
import { findLink } from '../../src/features/compare/compare';
import { IDS, isMobile, mainNav, press, sheet } from './helpers';

const left = (page: Page) => page.getByRole('combobox', { name: 'Premier élément' });
const right = (page: Page) => page.getByRole('combobox', { name: 'Second élément' });
const table = (page: Page) => page.getByRole('table', { name: 'Comparaison' });

// Deux concepts reliés, deux concepts non reliés
const linked = content.links.find(
  (l) => content.concepts.some((c) => c.id === l.source) && content.concepts.some((c) => c.id === l.target),
)!;
const unlinkedPair = (() => {
  for (const a of content.concepts)
    for (const b of content.concepts)
      if (a.id !== b.id && !findLink(content.links, a.id, b.id)) return [a.id, b.id] as const;
  throw new Error('aucune paire de concepts non reliés');
})();

test.describe('Comparateur', () => {
  test('C53 — accessible depuis la barre de navigation', async ({ page }, testInfo) => {
    await page.goto('/');
    await press(mainNav(page).getByRole('link', { name: 'Comparer' }), testInfo);
    await expect(page).toHaveURL('/comparer');
    await expect(left(page)).toBeVisible();
    await expect(right(page)).toBeVisible();
  });

  test('C53 — « Comparer avec… » depuis une fiche pré-remplit la fiche courante à gauche', async ({ page }, testInfo) => {
    await page.goto(`/cours/${IDS.concept}`);
    await press(page.getByTestId('sheet-header').getByRole('link', { name: 'Comparer avec…' }), testInfo);
    await expect(page).toHaveURL(`/comparer/${IDS.concept}`);
    await expect(left(page)).toHaveValue(IDS.concept);
  });

  test('C54 — deux concepts côte à côte, critère par critère', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'sur mobile : une colonne à la fois (C57)');
    const [a, b] = unlinkedPair;
    await page.goto(`/comparer/${a}/${b}`);
    const t = table(page);
    await expect(t.getByRole('columnheader')).toHaveText(['Critère', sheet(a).title, sheet(b).title]);
    await expect(t.getByRole('rowheader')).toHaveText([
      'Idée',
      'Problème résolu',
      'Quand l’utiliser',
      'Quand l’éviter',
      'Taille d’équipe et d’entreprise',
      'Pièges',
    ]);
    await expect(t.getByRole('row', { name: /^Idée/ })).toContainText(sheet(a).summary);
    await expect(t.getByRole('row', { name: /^Idée/ })).toContainText(sheet(b).summary);
  });

  test('C54 — deux secteurs côte à côte', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'sur mobile : une colonne à la fois (C57)');
    const [a, b] = [content.sectors[0]!.id, content.sectors[1]!.id];
    await page.goto(`/comparer/${a}/${b}`);
    await expect(table(page).getByRole('rowheader')).toHaveText([
      'Contraintes',
      'Petite entreprise',
      'Entreprise moyenne',
      'Grande entreprise',
      'Langage et framework',
      'Pièges',
    ]);
  });

  test('C54 — choisir un concept à gauche ne propose que des concepts à droite', async ({ page }) => {
    await page.goto(`/comparer/${IDS.concept}`);
    const options = await right(page).locator('option:not([value=""])').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    expect(options.sort()).toEqual(content.concepts.map((c) => c.id).filter((id) => id !== IDS.concept).sort());
  });

  test('C54 — une URL qui mélange concept et secteur affiche une explication, pas de tableau', async ({ page }) => {
    await page.goto(`/comparer/${IDS.concept}/${IDS.sector}`);
    await expect(page.getByRole('alert')).toContainText('deux concepts ou deux secteurs');
    await expect(table(page)).toHaveCount(0);
  });

  test('C55 — si un lien relie les deux éléments, son explication est affichée en haut', async ({ page }) => {
    await page.goto(`/comparer/${linked.source}/${linked.target}`);
    const region = page.getByRole('region', { name: 'Lien entre les deux' });
    await expect(region).toContainText(linked.title);
    await expect(region).toContainText(linked.explanation.slice(0, 60));
    const regionBox = (await region.boundingBox())!;
    const tableBox = (await table(page).boundingBox())!;
    expect(regionBox.y).toBeLessThan(tableBox.y);
  });

  test('C55 — sans lien, pas de bloc d’explication', async ({ page }) => {
    await page.goto(`/comparer/${unlinkedPair[0]}/${unlinkedPair[1]}`);
    await expect(page.getByRole('region', { name: 'Lien entre les deux' })).toHaveCount(0);
  });

  test('C56 — le choix met à jour l’URL, qui est partageable', async ({ page }) => {
    const [a, b] = unlinkedPair;
    await page.goto('/comparer');
    await left(page).selectOption(a);
    await expect(page).toHaveURL(`/comparer/${a}`);
    await right(page).selectOption(b);
    await expect(page).toHaveURL(`/comparer/${a}/${b}`);

    await page.goto(`/comparer/${a}/${b}`);
    await expect(left(page)).toHaveValue(a);
    await expect(right(page)).toHaveValue(b);
  });

  test('C57 — sur mobile, un sélecteur bascule entre les deux colonnes, sans défilement horizontal', async ({ page }, testInfo) => {
    test.skip(!isMobile(testInfo), 'mobile uniquement');
    const [a, b] = unlinkedPair;
    await page.goto(`/comparer/${a}/${b}`);
    const tabs = page.getByRole('tablist', { name: 'Colonne affichée' });
    await expect(tabs.getByRole('tab', { name: sheet(a).title })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toContainText(sheet(a).summary);
    await expect(page.getByRole('tabpanel')).not.toContainText(sheet(b).summary);

    await tabs.getByRole('tab', { name: sheet(b).title }).tap();
    await expect(page.getByRole('tabpanel')).toContainText(sheet(b).summary);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
