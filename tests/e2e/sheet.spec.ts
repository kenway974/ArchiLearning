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

const sectorSections = (withCompanies: boolean) => [
  'Contexte et contraintes',
  'Architecture selon la taille',
  'Langage et framework',
  'Arborescence',
  'Code',
  'Pièges courants',
  ...(withCompanies ? ['Entreprises'] : []),
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
    expect(await sectionTitles(page.getByRole('main'))).toEqual(sectorSections(s.companies.length > 0));

    const sizes = page.getByRole('region', { name: 'Architecture selon la taille' });
    for (const label of ['Petite entreprise', 'Entreprise moyenne', 'Grande entreprise']) {
      await expect(sizes.getByRole('heading', { level: 3, name: label })).toBeVisible();
    }
    await expect(page.getByRole('region', { name: 'Langage et framework' })).toContainText(s.stack.framework);
  });

  test('C31 — chaque entreprise citée affiche sa source', async ({ page }) => {
    const s = sheet(IDS.sector);
    if (s.kind !== 'sector') throw new Error('fiche secteur attendue');
    test.skip(s.companies.length === 0, 'pas d’entreprise citée dans cette fiche');
    await page.goto(`/cours/${s.id}`);
    const region = page.getByRole('region', { name: 'Entreprises' });
    for (const c of s.companies) {
      await expect(region.getByRole('link', { name: new RegExp(`Source.*${c.name}`) })).toHaveAttribute('href', c.source);
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
    const tree = page.getByRole('tree');
    const [first, second] = s.tree;
    if (!first || !second) throw new Error('arborescence trop courte pour le test');

    await press(tree.getByRole('treeitem', { name: first.name, exact: true }), testInfo);
    const explanation = page.getByRole('region', { name: /^Rôle de / });
    await expect(explanation).toHaveCount(1);
    await expect(explanation).toContainText(first.role);

    await press(tree.getByRole('treeitem', { name: second.name, exact: true }), testInfo);
    await expect(explanation).toHaveCount(1);
    await expect(explanation).toContainText(second.role);
    await expect(explanation).not.toContainText(first.role);
  });

  test('C33 — l’arborescence est dépliée par défaut et se pilote au clavier', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'clavier : ordinateur uniquement');
    const s = sheet(IDS.sector);
    await page.goto(`/cours/${s.id}`);
    const dir = s.tree.find((n) => n.kind === 'dir' && (n.children?.length ?? 0) > 0)!;
    const child = page.getByRole('treeitem', { name: dir.children![0]!.name, exact: true }).first();
    const item = page.getByRole('tree').getByRole('treeitem', { name: dir.name, exact: true }).first();
    await expect(item).toHaveAttribute('aria-expanded', 'true');
    await expect(child).toBeVisible();

    await item.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('region', { name: `Rôle de ${dir.name}` })).toContainText(dir.role);
    await page.keyboard.press('ArrowLeft');
    await expect(item).toHaveAttribute('aria-expanded', 'false');
    await expect(child).toBeHidden();
    await page.keyboard.press('ArrowRight');
    await expect(item).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(child).toBeFocused();
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
