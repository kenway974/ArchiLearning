import { expect, test, type Locator, type Page } from '@playwright/test';
import type { TreeNode } from '../../src/content/schema';
import { IDS, link, openSheetFromMap, press, sheet } from './helpers';

const CONCEPT_SECTIONS = [
  'Idée',
  'Problème résolu',
  'Quand l’utiliser',
  'Quand l’éviter',
  'Taille d’équipe et d’entreprise',
  'Arborescence',
  'Code',
  'Pièges',
  'Architectures voisines',
  'Quiz',
  'Idée de post LinkedIn',
];

const SECTOR_SECTIONS = [
  'Contexte et contraintes',
  'Architecture selon la taille',
  'Exemples d’entreprises',
  'Langage et framework',
  'Arborescence',
  'Code',
  'Pièges courants',
  'Quiz',
  'Idée de post LinkedIn',
];

const sectionTitles = (scope: Locator) => scope.getByRole('heading', { level: 2 }).allInnerTexts();

/** Tous les nœuds d'une arborescence, à plat. */
const flatten = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((n) => [n, ...flatten(n.children ?? [])]);

async function grantClipboard(page: Page) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
}

test.describe('Fiches', () => {
  test('C30 — une fiche concept affiche ses sections dans l’ordre (pleine page)', async ({ page }) => {
    await page.goto(`/cours/${IDS.concept}`);
    expect(await sectionTitles(page.getByRole('main'))).toEqual(CONCEPT_SECTIONS);
  });

  test('C30 — même contenu dans le panneau de la carte', async ({ page }, testInfo) => {
    const panel = await openSheetFromMap(page, IDS.concept, testInfo);
    expect(await sectionTitles(panel)).toEqual(CONCEPT_SECTIONS);
  });

  test('C31 — une fiche secteur affiche ses sections dans l’ordre', async ({ page }) => {
    const s = sheet(IDS.sector);
    if (s.kind !== 'sector') throw new Error('fiche secteur attendue');
    await page.goto(`/cours/${s.id}`);
    expect(await sectionTitles(page.getByRole('main'))).toEqual(SECTOR_SECTIONS);

    const sizes = page.getByRole('region', { name: 'Architecture selon la taille' });
    for (const label of ['Petite entreprise', 'Entreprise moyenne', 'Grande entreprise']) {
      await expect(sizes.getByRole('heading', { level: 3, name: label })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Langage et framework' })).toContainText(s.stack.framework);
  });

  test('C31 — trois entreprises fictives illustrent les pratiques selon la taille', async ({ page }) => {
    const s = sheet(IDS.sector);
    if (s.kind !== 'sector') throw new Error('fiche secteur attendue');
    await page.goto(`/cours/${s.id}`);
    const region = page.getByRole('region', { name: 'Exemples d’entreprises' });
    await expect(region).toContainText('fictives');
    for (const example of s.examples) {
      const card = region.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: example.name }) });
      await expect(card).toContainText(example.profile);
      await expect(card).toContainText(example.practices[0]!);
    }
  });

  test('C32 — en haut de la fiche : mindmap, comparer, marquer comme lue', async ({ page }, testInfo) => {
    const s = sheet(IDS.concept);
    await page.goto(`/cours/${s.id}`);
    const header = page.getByTestId('sheet-header');
    await expect(header.getByRole('button', { name: 'Marquer comme lue' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Comparer avec…' })).toBeVisible();
    await press(header.getByRole('link', { name: 'Voir sur la mindmap' }), testInfo);
    await expect(page).toHaveURL(`/carte/${s.id}`);
  });

  test('C33 — cliquer sur un dossier ou un fichier de l’arborescence explique son rôle, un à la fois', async ({ page }, testInfo) => {
    const s = sheet(IDS.sector);
    await page.goto(`/cours/${s.id}`);
    // Plusieurs fichiers peuvent porter le même nom (ex. un pom.xml par module) : on cible par position.
    const items = page.getByRole('tree').getByRole('treeitem');
    const nodes = flatten(s.tree);
    const [first, second] = s.tree;
    if (!first || !second) throw new Error('arborescence trop courte pour le test');

    await press(items.nth(nodes.indexOf(first)), testInfo);
    const explanation = page.getByRole('region', { name: /^Rôle de / });
    await expect(explanation).toHaveCount(1);
    await expect(explanation).toContainText(first.role);

    await press(items.nth(nodes.indexOf(second)), testInfo);
    await expect(explanation).toHaveCount(1);
    await expect(explanation).toContainText(second.role);
    await expect(explanation).not.toContainText(first.role);
  });

  test('C33 — l’arborescence est dépliée par défaut et se pilote au clavier', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'clavier : ordinateur uniquement');
    const s = sheet(IDS.sector);
    await page.goto(`/cours/${s.id}`);
    const items = page.getByRole('tree').getByRole('treeitem');
    const nodes = flatten(s.tree);
    const dir = s.tree.find((n) => n.kind === 'dir' && (n.children?.length ?? 0) > 0)!;
    const item = items.nth(nodes.indexOf(dir));
    const child = items.nth(nodes.indexOf(dir.children![0]!));
    await expect(item).toHaveAttribute('aria-expanded', 'true');
    await expect(child).toHaveAttribute('aria-level', '2');

    await item.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: `Rôle de ${dir.name}` })).toContainText(dir.role);
    await page.keyboard.press('ArrowLeft');
    await expect(item).toHaveAttribute('aria-expanded', 'false');
    await expect(items).toHaveCount(nodes.length - flatten(dir.children!).length);
    await page.keyboard.press('ArrowRight');
    await expect(item).toHaveAttribute('aria-expanded', 'true');
    await expect(items).toHaveCount(nodes.length);
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(nodes.indexOf(dir) + 1)).toBeFocused();
  });

  test('C33 — chaque élément de l’arborescence affiche son explication', async ({ page }, testInfo) => {
    for (const id of [IDS.sector, IDS.concept]) {
      const s = sheet(id);
      await page.goto(`/cours/${s.id}`);
      const items = page.getByRole('tree').getByRole('treeitem');
      const nodes = flatten(s.tree); // même ordre que l'affichage, tout étant déplié
      await expect(items).toHaveCount(nodes.length);
      for (const [i, node] of nodes.entries()) {
        await press(items.nth(i), testInfo);
        await expect(page.getByRole('region', { name: `Rôle de ${node.name}` })).toContainText(node.role);
      }
    }
  });

  test('C34 — extrait de code : coloration, langage et bouton « Copier »', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'presse-papiers testé sur ordinateur');
    await grantClipboard(page);
    const s = sheet(IDS.sector);
    await page.goto(`/cours/${s.id}`);
    const code = page.getByRole('region', { name: 'Code' });
    await expect(code.getByTestId('code-language')).toHaveAttribute('data-language', s.code.language);
    await expect(code.getByTestId('code-language')).not.toBeEmpty();
    await expect(code.getByText(s.code.filename)).toBeVisible();
    // coloration syntaxique : le code est découpé en éléments colorés
    expect(await code.locator('pre code span').count()).toBeGreaterThan(5);

    await code.getByRole('button', { name: 'Copier le code' }).click();
    await expect(code.getByRole('button', { name: 'Copié' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(s.code.source);
  });

  test('C35 — une architecture voisine ouvre l’explication de la relation', async ({ page }, testInfo) => {
    const s = sheet(IDS.concept);
    if (s.kind !== 'concept') throw new Error('fiche concept attendue');
    const neighbor = s.neighbors[0];
    if (!neighbor) throw new Error(`${s.id} n’a pas d’architecture voisine`);
    await page.goto(`/cours/${s.id}`);
    await press(page.getByRole('region', { name: 'Architectures voisines' }).getByRole('link', { name: new RegExp(sheet(neighbor).title) }), testInfo);
    await expect(page).toHaveURL(/\/liens\//);
    await expect(page.getByRole('main')).toContainText(sheet(neighbor).title);
  });

  test('C36 — l’idée de post LinkedIn a un bouton « Copier »', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'presse-papiers testé sur ordinateur');
    await grantClipboard(page);
    const s = sheet(IDS.concept);
    await page.goto(`/cours/${s.id}`);
    const region = page.getByRole('region', { name: 'Idée de post LinkedIn' });
    await region.getByRole('button', { name: 'Copier le post' }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(s.linkedinPost);
  });

  test('C37 — une page de lien affiche titre, deux nœuds cliquables et explication', async ({ page }, testInfo) => {
    const l = link(IDS.link);
    await page.goto(`/liens/${l.id}`);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: l.title })).toBeVisible();
    await expect(main).toContainText(l.explanation.slice(0, 60));
    await expect(main.getByRole('link', { name: sheet(l.target).title, exact: true })).toBeVisible();
    await press(main.getByRole('link', { name: sheet(l.source).title, exact: true }), testInfo);
    await expect(page).toHaveURL(`/cours/${l.source}`);
  });
});
