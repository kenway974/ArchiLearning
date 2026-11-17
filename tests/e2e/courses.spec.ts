import { expect, test, type Page } from '@playwright/test';
import { content } from '../../src/content/index';
import { IDS, press, seedProgress, sheet } from './helpers';

const section = (page: Page, name: 'Concepts' | 'Secteurs') => page.getByRole('region', { name });
const cards = (page: Page) => page.getByRole('main').getByRole('article');
const search = (page: Page) => page.getByRole('searchbox', { name: 'Rechercher un cours' });
const filter = (page: Page, name: 'Tous' | 'Non lus' | 'Lus') =>
  page.getByRole('radiogroup', { name: 'Filtrer' }).getByRole('radio', { name, exact: true });

test.describe('Liste des cours', () => {
  test('C07 — deux sections, une carte par cours avec titre, idée et coche si lu', async ({ page }) => {
    await seedProgress(page, { read: [IDS.concept] });
    await page.goto('/cours');

    await expect(section(page, 'Concepts').getByRole('article')).toHaveCount(content.concepts.length);
    await expect(section(page, 'Secteurs').getByRole('article')).toHaveCount(content.sectors.length);

    const concept = sheet(IDS.concept);
    const card = cards(page).filter({ has: page.getByRole('heading', { name: concept.title, exact: true }) });
    await expect(card).toContainText(concept.summary);
    await expect(card.getByText('Lu', { exact: true })).toBeVisible();

    const unread = sheet(IDS.sector);
    const unreadCard = cards(page).filter({ has: page.getByRole('heading', { name: unread.title, exact: true }) });
    await expect(unreadCard.getByText('Lu', { exact: true })).toHaveCount(0);
  });

  test('C08 — la recherche filtre par mot-clé, sans tenir compte des accents ni des majuscules', async ({ page }) => {
    await page.goto('/cours');
    await search(page).fill('EVENT SOURCING');
    await expect(cards(page).getByRole('heading', { name: sheet('event-sourcing').title, exact: true })).toBeVisible();
    await expect(cards(page).getByRole('heading', { name: sheet('mvc').title, exact: true })).toHaveCount(0);

    await search(page).fill('evenementielle');
    await expect(
      cards(page).getByRole('heading', { name: sheet('architecture-evenementielle').title, exact: true }),
    ).toBeVisible();
  });

  test('C08 — aucun résultat : message et bouton pour effacer la recherche', async ({ page }, testInfo) => {
    await page.goto('/cours');
    await search(page).fill('zzzz-aucun-cours-zzzz');
    await expect(page.getByText('Aucun cours ne correspond')).toBeVisible();
    await expect(cards(page)).toHaveCount(0);
    await press(page.getByRole('button', { name: 'Effacer la recherche' }), testInfo);
    await expect(search(page)).toHaveValue('');
    await expect(cards(page)).toHaveCount(content.concepts.length + content.sectors.length);
  });

  test('C09 — filtre Tous / Non lus / Lus, combinable avec la recherche', async ({ page }, testInfo) => {
    const total = content.concepts.length + content.sectors.length;
    await seedProgress(page, { read: [IDS.concept, IDS.sector] });
    await page.goto('/cours');

    await expect(filter(page, 'Tous')).toBeChecked();
    await press(filter(page, 'Lus'), testInfo);
    await expect(cards(page)).toHaveCount(2);
    await press(filter(page, 'Non lus'), testInfo);
    await expect(cards(page)).toHaveCount(total - 2);

    await search(page).fill(sheet(IDS.concept).title);
    await expect(cards(page).getByRole('heading', { name: sheet(IDS.concept).title, exact: true })).toHaveCount(0);
    await press(filter(page, 'Lus'), testInfo);
    await expect(cards(page).getByRole('heading', { name: sheet(IDS.concept).title, exact: true })).toBeVisible();
  });

  test('C10 — cliquer sur un cours ouvre sa fiche en pleine page', async ({ page }, testInfo) => {
    await page.goto('/cours');
    const s = sheet(IDS.sector);
    await press(cards(page).getByRole('link', { name: new RegExp(s.title) }), testInfo);
    await expect(page).toHaveURL(`/cours/${s.id}`);
    await expect(page.getByRole('heading', { level: 1, name: s.title })).toBeVisible();
    await expect(page.locator('.react-flow__viewport')).toHaveCount(0);
  });
});
