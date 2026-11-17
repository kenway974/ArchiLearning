import { expect, test } from '@playwright/test';
import { STORAGE_KEY } from '../../src/features/progress/storage';
import {
  IDS,
  answerQuiz,
  mapNode,
  openMap,
  press,
  readStoredProgress,
  seedProgress,
  sheet,
} from './helpers';

test.describe('Progression', () => {
  test('C46 — « Marquer comme lue » puis « Marquer comme non lue »', async ({ page }, testInfo) => {
    await page.goto(`/cours/${IDS.concept}`);
    const header = page.getByTestId('sheet-header');
    await press(header.getByRole('button', { name: 'Marquer comme lue' }), testInfo);
    await expect(header.getByRole('button', { name: 'Marquer comme non lue' })).toBeVisible();
    expect((await readStoredProgress(page))?.read).toEqual([IDS.concept]);

    await press(header.getByRole('button', { name: 'Marquer comme non lue' }), testInfo);
    await expect(header.getByRole('button', { name: 'Marquer comme lue' })).toBeVisible();
    expect((await readStoredProgress(page))?.read).toEqual([]);
  });

  test('C46 — terminer le quiz marque la fiche comme lue', async ({ page }, testInfo) => {
    const s = sheet(IDS.concept);
    await page.goto(`/cours/${s.id}`);
    await answerQuiz(page.getByRole('region', { name: 'Quiz' }), s, 0, testInfo);
    await expect(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme non lue' })).toBeVisible();
  });

  test('C47 — les fiches lues sont cochées sur la carte et dans la liste des cours', async ({ page }) => {
    await seedProgress(page, { read: [IDS.concept] });
    await openMap(page);
    await expect(mapNode(page, IDS.concept)).toHaveAttribute('data-read', 'true');
    await expect(mapNode(page, IDS.concept)).toHaveAccessibleName(new RegExp(`^${sheet(IDS.concept).title}, concept, lu(,|$)`));
    await expect(mapNode(page, IDS.sector)).toHaveAttribute('data-read', 'false');
    await expect(mapNode(page, IDS.concept).getByTestId('read-check')).toBeVisible();
    await expect(mapNode(page, IDS.sector).getByTestId('read-check')).toHaveCount(0);

    await page.goto('/cours');
    const card = page.getByRole('article').filter({ has: page.getByRole('heading', { name: sheet(IDS.concept).title, exact: true }) });
    await expect(card.getByText('Lu', { exact: true })).toBeVisible();
  });

  test('C48 — fiches lues, scores, parcours et thème sont retrouvés après rechargement', async ({ page }, testInfo) => {
    const s = sheet(IDS.concept);
    await page.goto(`/cours/${s.id}`);
    await press(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme lue' }), testInfo);
    await answerQuiz(page.getByRole('region', { name: 'Quiz' }), s, 2, testInfo);
    await press(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('button', { name: /thème/i }), testInfo);
    const theme = await page.locator('html').getAttribute('data-theme');

    await page.reload();
    await expect(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme non lue' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Quiz' })).toContainText(`Meilleur score : 2 / ${s.quiz.length}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
  });

  test('C49 — localStorage inaccessible : l’app fonctionne, sans erreur visible ni en console', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Accès refusé', 'SecurityError');
        },
      });
    });
    await page.goto(`/cours/${IDS.concept}`);
    await press(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme lue' }), testInfo);
    // l'état est gardé en mémoire pour la session
    await expect(page.getByTestId('sheet-header').getByRole('button', { name: 'Marquer comme non lue' })).toBeVisible();
    await openMap(page);
    await expect(mapNode(page, IDS.concept)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('C49 — données corrompues : progression vide, aucune erreur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript((key) => localStorage.setItem(key, '{pas du json'), STORAGE_KEY);
    await page.goto('/progression');
    await expect(page.getByTestId('progress-total')).toHaveText(/^0 \//);
    expect(errors).toEqual([]);
  });
});
