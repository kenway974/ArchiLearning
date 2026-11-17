import { expect, test, type Locator, type Page } from '@playwright/test';
import { buildPath, getStepReason } from '../../src/features/path/buildPath';
import {
  IDS,
  allSheets,
  isMobile,
  mapNode,
  openMap,
  press,
  readStoredProgress,
  seedProgress,
  sheet,
  sheetPanel,
  viewportTransform,
  waitForViewportStable,
} from './helpers';

const TARGET = IDS.concept;
const fullPath = () => buildPath(allSheets, TARGET, new Set());
const intro = (scope: Page | Locator) => scope.getByRole('region', { name: 'Avant de commencer' });
const nextBlock = (scope: Page | Locator) => scope.getByRole('region', { name: 'Suite du parcours' });

test.beforeAll(() => {
  if (fullPath().length < 3) throw new Error(`Le parcours de ${TARGET} doit compter au moins 3 étapes pour ces tests`);
});

test.describe('Parcours par sujet', () => {
  test('C39 — une fiche avec prérequis non lus propose de commencer par eux, sans empêcher la lecture', async ({ page }) => {
    const path = fullPath();
    await page.goto(`/cours/${TARGET}`);
    const block = intro(page);
    await expect(block).toContainText('Pour bien comprendre ce sujet, commence par');
    for (const id of path.slice(0, -1)) await expect(block.getByRole('listitem').filter({ hasText: sheet(id).title })).toBeVisible();
    await expect(block.getByRole('button', { name: 'Suivre le parcours' })).toBeVisible();
    // la fiche reste lisible directement
    await expect(page.getByRole('heading', { level: 2, name: 'Problème résolu' })).toBeVisible();
  });

  test('C39 — les prérequis déjà lus ne sont plus proposés', async ({ page }) => {
    const path = fullPath();
    const [firstRead, ...rest] = path.slice(0, -1);
    await seedProgress(page, { read: [firstRead!] });
    await page.goto(`/cours/${TARGET}`);
    await expect(intro(page).getByRole('listitem').filter({ hasText: sheet(firstRead!).title })).toHaveCount(0);
    for (const id of rest) await expect(intro(page).getByRole('listitem').filter({ hasText: sheet(id).title })).toBeVisible();
  });

  test('C39 — une fiche sans prérequis non lu n’affiche pas ce bloc', async ({ page }) => {
    await page.goto(`/cours/${IDS.conceptSansPrerequis}`);
    await expect(intro(page)).toHaveCount(0);
  });

  test('C40 — « Suivre le parcours » ouvre la première étape et mémorise le parcours', async ({ page }, testInfo) => {
    const path = fullPath();
    await page.goto(`/cours/${TARGET}`);
    await press(intro(page).getByRole('button', { name: 'Suivre le parcours' }), testInfo);
    await expect(page).toHaveURL(`/cours/${path[0]}`);
    expect((await readStoredProgress(page))?.activePath).toEqual({ target: TARGET, steps: path });
  });

  test('C41 — pendant le parcours : étape, « Suivant : <titre> » et la phrase qui explique pourquoi', async ({ page }) => {
    const path = fullPath();
    await seedProgress(page, { activePath: { target: TARGET, steps: path } });
    await page.goto(`/cours/${path[0]}`);
    const block = nextBlock(page);
    await expect(block).toContainText(`Étape 1 / ${path.length}`);
    await expect(block.getByRole('button', { name: `Suivant : ${sheet(path[1]!).title}` })).toBeVisible();
    await expect(block).toContainText(getStepReason(allSheets, path, path[0]!)!);
  });

  test('C42 — en pleine page, « Suivant » marque la fiche lue et ouvre l’étape suivante', async ({ page }, testInfo) => {
    const path = fullPath();
    await seedProgress(page, { activePath: { target: TARGET, steps: path } });
    await page.goto(`/cours/${path[0]}`);
    await press(nextBlock(page).getByRole('button', { name: /^Suivant : / }), testInfo);
    await expect(page).toHaveURL(`/cours/${path[1]}`);
    await expect(nextBlock(page)).toContainText(`Étape 2 / ${path.length}`);
    expect((await readStoredProgress(page))?.read).toContain(path[0]);
  });

  test('C42 — sur la carte, « Suivant » fait glisser la carte jusqu’au nœud suivant et ouvre sa fiche', async ({ page }, testInfo) => {
    const path = fullPath();
    await seedProgress(page, { activePath: { target: TARGET, steps: path } });
    await openMap(page, `/carte/${path[0]}`);
    const panel = sheetPanel(page, sheet(path[0]!).title);
    if (isMobile(testInfo)) await press(panel.getByRole('button', { name: 'Voir toute la fiche' }), testInfo);
    const before = await viewportTransform(page);

    await press(nextBlock(panel).getByRole('button', { name: /^Suivant : / }), testInfo);
    await expect(page).toHaveURL(`/carte/${path[1]}`);
    await expect(sheetPanel(page, sheet(path[1]!).title)).toBeVisible();
    await waitForViewportStable(page);
    const after = await viewportTransform(page);
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(10);
    await expect(mapNode(page, path[1]!)).toBeInViewport();
    await expect(mapNode(page, path[0]!)).toHaveAttribute('data-read', 'true');
  });

  test('C43 — sur la carte, l’étape suivante du parcours est mise en évidence', async ({ page }) => {
    const path = fullPath();
    await seedProgress(page, { read: [path[0]!], activePath: { target: TARGET, steps: path } });
    await openMap(page);
    await expect(mapNode(page, path[1]!)).toHaveAttribute('data-next', 'true');
    await expect(mapNode(page, path[1]!).getByText('Suivant', { exact: true })).toBeVisible();
    for (const id of [path[0]!, path[2]!]) await expect(mapNode(page, id)).toHaveAttribute('data-next', 'false');
  });

  test('C43 — sans parcours en cours, aucun nœud n’est mis en évidence', async ({ page }) => {
    await openMap(page);
    await expect(page.locator('[data-next="true"]')).toHaveCount(0);
  });

  test('C44 — dernière étape : « Parcours terminé » et suites proposées ; lire la fiche clôt le parcours', async ({ page }, testInfo) => {
    const path = fullPath();
    const target = sheet(TARGET);
    await seedProgress(page, { read: path.slice(0, -1), activePath: { target: TARGET, steps: path } });
    await page.goto(`/cours/${TARGET}`);
    const block = nextBlock(page);
    await expect(block).toContainText('Parcours terminé');
    await expect(block.getByRole('button', { name: /^Suivant : / })).toHaveCount(0);
    for (const step of target.nextSteps) {
      await expect(block.getByRole('link', { name: sheet(step.id).title })).toBeVisible();
    }
    await press(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme lue' }), testInfo);
    expect((await readStoredProgress(page))?.activePath).toBeNull();
  });

  test('C45 — hors parcours, la fiche se termine par « Pour aller plus loin » avec les explications', async ({ page }) => {
    const s = allSheets.find((x) => x.nextSteps.length > 0);
    if (!s) throw new Error('aucune fiche n’a de suite');
    await page.goto(`/cours/${s.id}`);
    const region = page.getByRole('region', { name: 'Pour aller plus loin' });
    for (const step of s.nextSteps) {
      await expect(region.getByRole('link', { name: sheet(step.id).title })).toHaveAttribute('href', `/cours/${step.id}`);
      await expect(region).toContainText(step.reason);
    }
    await expect(nextBlock(page)).toHaveCount(0);
  });
});
