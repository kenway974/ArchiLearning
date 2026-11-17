import { expect, test } from '@playwright/test';
import { content } from '../../src/content/index';
import { IDS, isMobile, mapNode, openMap, press, principle, sheet, sheetPanel } from './helpers';

const p = principle(IDS.principle);
const conceptsOf = (pid: string) => principle(pid).applications.map((a) => a.concept);

test.describe('Familles et principes partagés', () => {
  test('C72 — les familles sont des nœuds de la carte, avec un nom accessible', async ({ page }) => {
    await openMap(page);
    for (const family of content.families) {
      await expect(mapNode(page, family.id)).toHaveAttribute('data-type', 'family');
      await expect(mapNode(page, family.id)).toHaveAccessibleName(
        `${family.title}, famille, ${family.concepts.length} concepts`,
      );
    }
  });

  test('C73 — chaque principe est un nœud, relié à ses concepts par une ligne', async ({ page }) => {
    await openMap(page);
    for (const pr of content.principles) {
      await expect(mapNode(page, pr.id)).toHaveAttribute('data-type', 'principle');
      await expect(mapNode(page, pr.id)).toHaveAccessibleName(`${pr.title}, principe, ${pr.applications.length} concepts`);
      for (const a of pr.applications) {
        await expect(page.getByTestId(`rf__edge-principle:${pr.id}->${a.concept}`)).toBeAttached();
      }
    }
  });

  test('C73 — chaque concept porte une pastille par principe qu’il applique', async ({ page }) => {
    await openMap(page);
    for (const concept of content.concepts) {
      const expected = content.principles.filter((pr) => pr.applications.some((a) => a.concept === concept.id));
      const badges = mapNode(page, concept.id).locator('[data-badge]');
      await expect(badges).toHaveCount(expected.length);
      for (const pr of expected) await expect(mapNode(page, concept.id).locator(`[data-badge="${pr.id}"]`)).toBeAttached();
    }
  });

  test('C75 — survoler un principe met en évidence ses concepts', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'survol : ordinateur uniquement');
    await openMap(page);
    await mapNode(page, p.id).hover();
    for (const id of conceptsOf(p.id)) await expect(mapNode(page, id)).toHaveAttribute('data-dimmed', 'false');
    const other = content.concepts.find((c) => !conceptsOf(p.id).includes(c.id))!;
    await expect(mapNode(page, other.id)).toHaveAttribute('data-dimmed', 'true');
  });

  test('C75 — cliquer un principe ouvre sa fiche dans le panneau', async ({ page }, testInfo) => {
    test.skip(isMobile(testInfo), 'sur mobile, la fiche est ouverte par son URL dans le test suivant');
    await openMap(page);
    await mapNode(page, p.id).click();
    await expect(page).toHaveURL(`/carte/${p.id}`);
    const panel = sheetPanel(page, p.title);
    await expect(panel).toContainText(p.summary);
    for (const a of p.applications) {
      await expect(panel.getByRole('link', { name: sheet(a.concept).title, exact: true })).toBeVisible();
      await expect(panel).toContainText(a.how);
    }
  });

  test('C75 — la fiche d’un principe s’ouvre aussi par son URL, sur la carte et en pleine page', async ({ page }, testInfo) => {
    await openMap(page, `/carte/${p.id}`);
    await expect(sheetPanel(page, p.title)).toBeVisible();

    await page.goto(`/principes/${p.id}`);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: p.title })).toBeVisible();
    await expect(main).toContainText(p.why);
    const first = p.applications[0]!;
    await press(main.getByRole('link', { name: sheet(first.concept).title, exact: true }), testInfo);
    await expect(page).toHaveURL(`/cours/${first.concept}`);
  });

  test('C76 — une fiche concept liste ses principes appliqués, chacun mène à sa fiche', async ({ page }, testInfo) => {
    const concept = sheet(IDS.concept);
    const expected = content.principles.filter((pr) => pr.applications.some((a) => a.concept === concept.id));
    await page.goto(`/cours/${concept.id}`);
    const region = page.getByRole('region', { name: 'Principes appliqués' });
    for (const pr of expected) await expect(region.getByRole('link', { name: pr.title })).toBeVisible();
    await press(region.getByRole('link', { name: expected[0]!.title }), testInfo);
    await expect(page).toHaveURL(`/principes/${expected[0]!.id}`);
  });

  test('C06 — un principe inconnu affiche « Introuvable »', async ({ page }) => {
    await page.goto('/principes/principe-inexistant');
    await expect(page.getByRole('heading', { level: 1, name: 'Introuvable' })).toBeVisible();
  });
});
