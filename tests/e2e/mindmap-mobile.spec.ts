import { expect, test, type Locator, type Page } from '@playwright/test';
import { content } from '../../src/content/index';
import {
  IDS,
  centerOf,
  link,
  linkLabel,
  mapNode,
  openMap,
  pinch,
  sheet,
  sheetPanel,
  swipe,
  viewportTransform,
  waitForViewportStable,
} from './helpers';

const VIEW = { width: 390, height: 844 };
const breadcrumb = (page: Page) => page.getByRole('navigation', { name: 'Fil d’Ariane' });

test.skip(({ isMobile }) => !isMobile, 'mobile uniquement');

/** Enregistre toutes les valeurs successives de la transformation de la carte. */
async function recordTransforms(page: Page) {
  await page.locator('.react-flow__viewport').evaluate((el) => {
    const w = window as unknown as { __transforms: string[] };
    w.__transforms = [];
    new MutationObserver(() => w.__transforms.push((el as HTMLElement).style.transform)).observe(el, {
      attributes: true,
      attributeFilter: ['style'],
    });
  });
  return () => page.evaluate(() => new Set((window as unknown as { __transforms: string[] }).__transforms).size);
}

async function expectCentered(node: Locator) {
  const c = await centerOf(node);
  expect(Math.abs(c.x - VIEW.width / 2)).toBeLessThan(30);
  // Le centre vertical tient compte du fil d'Ariane en haut et de la barre en bas
  expect(c.y).toBeGreaterThan(VIEW.height * 0.25);
  expect(c.y).toBeLessThan(VIEW.height * 0.65);
}

/** Va jusqu'à la fiche CQRS en touchant la carte : racine → Concepts → CQRS. */
async function focusConcept(page: Page) {
  await openMap(page);
  await mapNode(page, 'concepts').tap();
  await waitForViewportStable(page);
  const node = mapNode(page, IDS.concept);
  await expect(node).toBeInViewport();
  await node.tap();
  await waitForViewportStable(page);
  return node;
}

test.describe('Mindmap — mobile', () => {
  test('C24 — zoom à deux doigts', async ({ page }) => {
    await openMap(page);
    const before = (await viewportTransform(page)).zoom;
    await pinch(page, 1.8);
    await waitForViewportStable(page);
    expect((await viewportTransform(page)).zoom).toBeGreaterThan(before * 1.2);
  });

  test('C24 — déplacement au doigt', async ({ page }) => {
    await openMap(page);
    const before = await viewportTransform(page);
    // Glissement dans une zone vide, au-dessus de la barre de navigation
    await swipe(page, { x: 30, y: 600 }, { x: 180, y: 500 });
    await waitForViewportStable(page);
    const after = await viewportTransform(page);
    expect(after.x - before.x).toBeGreaterThan(100);
    expect(before.y - after.y).toBeGreaterThan(50);
  });

  test('C25 — à l’ouverture, la racine est au centre avec ses deux branches', async ({ page }) => {
    await openMap(page);
    await expect(mapNode(page, 'root')).toHaveAttribute('data-focused', 'true');
    await expectCentered(mapNode(page, 'root'));
    await expect(mapNode(page, 'concepts')).toBeInViewport();
    await expect(mapNode(page, 'sectors')).toBeInViewport();
  });

  test('C25 — toucher un nœud le centre avec une animation, voisins nets, reste estompé', async ({ page }) => {
    await openMap(page);
    const distinctTransforms = await recordTransforms(page);
    await mapNode(page, 'concepts').tap();
    await waitForViewportStable(page);
    expect(await distinctTransforms()).toBeGreaterThanOrEqual(3); // plusieurs images intermédiaires

    await expect(mapNode(page, 'concepts')).toHaveAttribute('data-focused', 'true');
    await expectCentered(mapNode(page, 'concepts'));
    await expect(mapNode(page, 'root')).toHaveAttribute('data-dimmed', 'false'); // parent
    await expect(mapNode(page, content.concepts[0]!.id)).toHaveAttribute('data-dimmed', 'false'); // enfant
    await expect(mapNode(page, content.sectors[0]!.id)).toHaveAttribute('data-dimmed', 'true'); // hors voisinage
  });

  test('C25 — les nœuds reliés par un lien transverse restent nets', async ({ page }) => {
    const l = link(IDS.link);
    await openMap(page, `/carte/${l.target}`);
    await expect(mapNode(page, l.target)).toHaveAttribute('data-focused', 'true');
    await expect(mapNode(page, l.source)).toHaveAttribute('data-dimmed', 'false');
    await expect(linkLabel(page, l.id)).toHaveAttribute('data-dimmed', 'false');
  });

  test('C26 — le fil d’Ariane montre le chemin et permet de remonter', async ({ page }) => {
    await focusConcept(page);
    const crumbs = breadcrumb(page);
    await expect(crumbs.getByRole('button')).toHaveText(['Architectures logicielles', 'Concepts', sheet(IDS.concept).title]);
    await expect(crumbs.getByRole('button', { name: sheet(IDS.concept).title })).toHaveAttribute('aria-current', 'location');

    await sheetPanel(page, sheet(IDS.concept).title).getByRole('button', { name: 'Fermer' }).tap();
    await crumbs.getByRole('button', { name: 'Architectures logicielles' }).tap();
    await waitForViewportStable(page);
    await expect(mapNode(page, 'root')).toHaveAttribute('data-focused', 'true');
    await expect(crumbs.getByRole('button')).toHaveText(['Architectures logicielles']);
  });

  test('C27 — toucher une fiche ouvre le panneau du bas à mi-hauteur, puis plein écran, puis fermé', async ({ page }) => {
    const s = sheet(IDS.concept);
    await focusConcept(page);
    const panel = sheetPanel(page, s.title);
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-snap', 'half');
    await expect(panel).toContainText(s.summary);
    await expect(panel.getByRole('button', { name: 'Voir toute la fiche' })).toBeVisible();

    const half = (await panel.boundingBox())!;
    expect(half.y).toBeGreaterThan(VIEW.height * 0.35);
    expect(half.y).toBeLessThan(VIEW.height * 0.65);
    await expect(mapNode(page, s.id)).toBeInViewport(); // la carte reste visible au-dessus

    // Glisser la poignée vers le haut → plein écran avec la fiche complète
    const handle = panel.getByTestId('sheet-handle');
    const h = await centerOf(handle);
    await swipe(page, h, { x: h.x, y: 60 });
    await expect(panel).toHaveAttribute('data-snap', 'full');
    await expect(panel.getByRole('heading', { name: 'Quiz' })).toBeAttached();
    expect((await panel.boundingBox())!.y).toBeLessThan(VIEW.height * 0.1);

    // Glisser vers le bas → retour à mi-hauteur, puis fermeture
    const h2 = await centerOf(handle);
    await swipe(page, h2, { x: h2.x, y: VIEW.height / 2 });
    await expect(panel).toHaveAttribute('data-snap', 'half');
    const h3 = await centerOf(handle);
    await swipe(page, h3, { x: h3.x, y: VIEW.height - 5 });
    await expect(panel).toHaveCount(0);
  });

  test('C27 — « Voir toute la fiche » passe en plein écran', async ({ page }) => {
    const s = sheet(IDS.concept);
    await focusConcept(page);
    const panel = sheetPanel(page, s.title);
    await panel.getByRole('button', { name: 'Voir toute la fiche' }).tap();
    await expect(panel).toHaveAttribute('data-snap', 'full');
  });

  test('C28 — toucher l’étiquette d’un lien ouvre son explication dans le panneau du bas', async ({ page }) => {
    const l = link(IDS.link);
    await openMap(page, `/carte/${l.target}`);
    const panel = sheetPanel(page, sheet(l.target).title);
    if (await panel.isVisible()) await panel.getByRole('button', { name: 'Fermer' }).tap();
    await expect(linkLabel(page, l.id)).toBeInViewport();
    await linkLabel(page, l.id).tap();
    const linkPanel = sheetPanel(page, l.title);
    await expect(linkPanel).toBeVisible();
    await expect(linkPanel).toHaveAttribute('data-snap', 'half');
    await expect(page).toHaveURL(`/carte/liens/${l.id}`);
  });

  test('C29 — toutes les zones tactiles mesurent au moins 44×44 px', async ({ page }) => {
    const tooSmall: string[] = [];
    const check = async (locator: Locator, label: string) => {
      for (const el of await locator.all()) {
        if (!(await el.isVisible())) continue;
        const box = (await el.boundingBox())!;
        if (box.width < 44 || box.height < 44) {
          tooSmall.push(`${label} « ${(await el.getAttribute('aria-label')) ?? (await el.innerText())} » ${box.width}×${box.height}`);
        }
      }
    };

    await focusConcept(page);
    await check(page.locator('[data-node-id]'), 'nœud');
    await check(page.locator('[data-link-id]'), 'lien');
    await check(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link'), 'navigation');
    await check(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button'), 'navigation');
    await check(breadcrumb(page).getByRole('button'), 'fil d’Ariane');
    await check(page.getByRole('button'), 'bouton');

    await page.goto(`/cours/${IDS.concept}`);
    await check(page.getByRole('button'), 'bouton de fiche');
    await check(page.getByRole('treeitem'), 'arborescence');

    await page.goto('/cours');
    await check(page.getByRole('radio'), 'filtre');
    await check(page.getByRole('main').getByRole('article').getByRole('link'), 'carte de cours');

    expect(tooSmall).toEqual([]);
  });
});
