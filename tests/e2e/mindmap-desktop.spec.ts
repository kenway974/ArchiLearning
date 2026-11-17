import { expect, test } from '@playwright/test';
import { content } from '../../src/content/index';
import {
  IDS,
  allSheets,
  link,
  linkLabel,
  mapNode,
  openMap,
  sheet,
  sheetPanel,
  viewportTransform,
  waitForViewportStable,
} from './helpers';

test.skip(({ isMobile }) => isMobile, 'ordinateur uniquement');

test.describe('Mindmap — ordinateur', () => {
  test('C18 — la carte entière est visible à l’ouverture', async ({ page }) => {
    await openMap(page);
    const ids = ['root', 'concepts', 'sectors', ...allSheets.map((s) => s.id)];
    for (const id of ids) await expect(mapNode(page, id)).toBeInViewport();
  });

  test('C18 — zoom à la molette et avec les boutons +/−', async ({ page }) => {
    await openMap(page);
    const start = (await viewportTransform(page)).zoom;

    await page.getByRole('button', { name: 'Zoom avant' }).click();
    await waitForViewportStable(page);
    const afterIn = (await viewportTransform(page)).zoom;
    expect(afterIn).toBeGreaterThan(start);

    await page.getByRole('button', { name: 'Zoom arrière' }).click();
    await waitForViewportStable(page);
    expect((await viewportTransform(page)).zoom).toBeLessThan(afterIn);

    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, -500);
    await waitForViewportStable(page);
    expect((await viewportTransform(page)).zoom).toBeGreaterThan(start);
  });

  test('C18 — déplacement en glissant le fond, puis « Recentrer » ramène la vue initiale', async ({ page }) => {
    await openMap(page);
    const initial = await viewportTransform(page);
    const pane = page.locator('.react-flow__pane');
    const box = (await pane.boundingBox())!;
    // Glisser depuis un coin vide de la carte
    await page.mouse.move(box.x + 20, box.y + box.height - 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + box.height - 120, { steps: 10 });
    await page.mouse.up();
    const moved = await viewportTransform(page);
    expect(moved.x).toBeCloseTo(initial.x + 200, -1);
    expect(moved.y).toBeCloseTo(initial.y - 100, -1);

    await page.getByRole('button', { name: 'Recentrer' }).click();
    await waitForViewportStable(page);
    const back = await viewportTransform(page);
    expect(back.x).toBeCloseTo(initial.x, 0);
    expect(back.y).toBeCloseTo(initial.y, 0);
    expect(back.zoom).toBeCloseTo(initial.zoom, 2);
  });

  test('C19 — replier puis déplier une branche', async ({ page }) => {
    await openMap(page);
    const concept = content.concepts[0]!.id;
    const sector = content.sectors[0]!.id;

    await page.getByRole('button', { name: 'Replier Concepts' }).click();
    await expect(mapNode(page, concept)).toHaveCount(0);
    await expect(mapNode(page, sector)).toBeVisible();
    // Les liens qui touchent un concept disparaissent aussi
    await expect(linkLabel(page, IDS.link)).toHaveCount(0);

    await page.getByRole('button', { name: 'Déplier Concepts' }).click();
    await expect(mapNode(page, concept)).toBeVisible();
    await expect(linkLabel(page, IDS.link)).toBeVisible();

    await page.getByRole('button', { name: 'Replier Secteurs' }).click();
    await expect(mapNode(page, sector)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Déplier Secteurs' })).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('button', { name: 'Replier Concepts' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('C20 — survoler un nœud met en évidence ses liens et nœuds reliés, estompe le reste', async ({ page }) => {
    await openMap(page);
    const l = link(IDS.link); // banque-fintech — event-sourcing
    await mapNode(page, l.source).hover();

    await expect(mapNode(page, l.source)).toHaveAttribute('data-dimmed', 'false');
    await expect(mapNode(page, l.target)).toHaveAttribute('data-dimmed', 'false');
    await expect(linkLabel(page, l.id)).toHaveAttribute('data-highlighted', 'true');

    // Un concept qui n'a aucun lien avec le nœud survolé
    const linkedTo = (a: string, b: string) =>
      content.links.some((x) => (x.source === a && x.target === b) || (x.source === b && x.target === a));
    const unrelated = content.concepts.find((c) => !linkedTo(c.id, l.source))!;
    await expect(mapNode(page, unrelated.id)).toHaveAttribute('data-dimmed', 'true');

    await page.mouse.move(5, 795);
    await expect(mapNode(page, unrelated.id)).toHaveAttribute('data-dimmed', 'false');
  });

  test('C21 — cliquer sur un nœud ouvre sa fiche dans un panneau latéral, la carte reste utilisable', async ({ page }) => {
    await openMap(page);
    const s = sheet(IDS.concept);
    await mapNode(page, s.id).click();
    const panel = sheetPanel(page, s.title);
    await expect(panel).toBeVisible();
    await expect(page).toHaveURL(`/carte/${s.id}`);

    const panelBox = (await panel.boundingBox())!;
    expect(panelBox.x).toBeGreaterThan(1280 / 3); // à droite
    expect(panelBox.height).toBeGreaterThan(800 * 0.8); // sur toute la hauteur
    await expect(page.locator('.react-flow__pane')).toBeVisible();

    // La carte reste interactive : un autre nœud remplace la fiche
    const other = sheet(IDS.sector);
    await mapNode(page, other.id).click();
    await expect(sheetPanel(page, other.title)).toBeVisible();
    await expect(sheetPanel(page, s.title)).toHaveCount(0);
  });

  test('C22 — cliquer sur l’étiquette d’un lien ouvre l’explication dans le panneau', async ({ page }) => {
    await openMap(page);
    const l = link(IDS.link);
    await expect(linkLabel(page, l.id)).toHaveAccessibleName(`Lien : ${l.title}`);
    // L'étiquette apparaît au survol d'un nœud du lien et reste le temps d'aller la cliquer
    await expect(linkLabel(page, l.id)).toHaveCSS('opacity', '0');
    await mapNode(page, l.source).hover();
    await expect(linkLabel(page, l.id)).toHaveCSS('opacity', '1');
    await linkLabel(page, l.id).click();
    const panel = sheetPanel(page, l.title);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(l.explanation.slice(0, 60));
    await expect(page).toHaveURL(`/carte/liens/${l.id}`);
  });

  test('C23 — le panneau se ferme par « Fermer » et par Échap', async ({ page }) => {
    const s = sheet(IDS.concept);
    await openMap(page, `/carte/${s.id}`);
    await sheetPanel(page, s.title).getByRole('button', { name: 'Fermer' }).click();
    await expect(sheetPanel(page, s.title)).toHaveCount(0);
    await expect(page).toHaveURL('/carte');

    await mapNode(page, s.id).click();
    await expect(sheetPanel(page, s.title)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheetPanel(page, s.title)).toHaveCount(0);
  });
});
