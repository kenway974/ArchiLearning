import { expect, test } from '@playwright/test';
import { content } from '../../src/content/index';
import { IDS, press, readStoredProgress, seedProgress, sheet } from './helpers';

test.describe('Page « Ma progression »', () => {
  test('C11 — affiche les fiches lues (total, concepts, secteurs) et les meilleurs scores', async ({ page }) => {
    const total = content.concepts.length + content.sectors.length;
    await seedProgress(page, {
      read: ['cqrs', 'ddd', IDS.sector],
      bestScores: { cqrs: { correct: 3, total: 4 } },
    });
    await page.goto('/progression');
    await expect(page.getByTestId('progress-total')).toHaveText(`3 / ${total}`);
    await expect(page.getByTestId('progress-concepts')).toHaveText(`2 / ${content.concepts.length}`);
    await expect(page.getByTestId('progress-sectors')).toHaveText(`1 / ${content.sectors.length}`);
    const scores = page.getByRole('region', { name: 'Meilleurs scores' });
    await expect(scores.getByRole('listitem').filter({ hasText: sheet('cqrs').title })).toContainText('3 / 4');
  });

  test('C11 — sans progression : 0 lu et invitation à commencer', async ({ page }) => {
    await page.goto('/progression');
    await expect(page.getByTestId('progress-total')).toHaveText(
      `0 / ${content.concepts.length + content.sectors.length}`,
    );
    await expect(page.getByRole('main').getByRole('link', { name: 'Voir les cours' })).toBeVisible();
  });

  test('C12 — un parcours en cours s’affiche avec son étape et le bouton « Reprendre »', async ({ page }, testInfo) => {
    const steps = ['architecture-en-couches', 'ddd', 'cqrs'];
    await seedProgress(page, { read: ['architecture-en-couches'], activePath: { target: 'cqrs', steps } });
    await page.goto('/progression');
    const block = page.getByRole('region', { name: 'Parcours en cours' });
    await expect(block).toContainText(sheet('cqrs').title);
    await expect(block).toContainText('Étape 2 / 3');
    await press(block.getByRole('link', { name: 'Reprendre' }), testInfo);
    await expect(page).toHaveURL('/cours/ddd');
  });

  test('C12 — pas de parcours en cours : pas de bloc « Parcours en cours »', async ({ page }) => {
    await page.goto('/progression');
    await expect(page.getByRole('region', { name: 'Parcours en cours' })).toHaveCount(0);
  });

  test('C13 — « Réinitialiser » demande confirmation ; annuler ne touche à rien', async ({ page }, testInfo) => {
    await seedProgress(page, { read: ['cqrs'] });
    await page.goto('/progression');
    await press(page.getByRole('button', { name: 'Réinitialiser ma progression' }), testInfo);
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await press(dialog.getByRole('button', { name: 'Annuler' }), testInfo);
    expect((await readStoredProgress(page))?.read).toEqual(['cqrs']);
  });

  test('C13 — confirmer efface fiches lues, scores et parcours', async ({ page }, testInfo) => {
    await seedProgress(page, {
      read: ['cqrs'],
      bestScores: { cqrs: { correct: 1, total: 3 } },
      activePath: { target: 'cqrs', steps: ['cqrs'] },
    });
    await page.goto('/progression');
    await press(page.getByRole('button', { name: 'Réinitialiser ma progression' }), testInfo);
    await press(page.getByRole('alertdialog').getByRole('button', { name: 'Tout effacer' }), testInfo);
    await expect(page.getByTestId('progress-total')).toHaveText(/^0 \//);
    const stored = await readStoredProgress(page);
    expect(stored).toMatchObject({ read: [], bestScores: {}, activePath: null });
  });
});
