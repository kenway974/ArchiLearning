import { expect, test } from '@playwright/test';
import { press } from './helpers';

test.describe('Ce qui s’apprend en entreprise', () => {
  test('C78 — la page est accessible depuis l’accueil', async ({ page }, testInfo) => {
    await page.goto('/');
    await press(page.getByRole('main').getByRole('link', { name: /Ce qui s’apprend en entreprise/ }), testInfo);
    await expect(page).toHaveURL('/terrain');
    await expect(page.getByRole('heading', { level: 1, name: /Ce qui s’apprend en entreprise/ })).toBeVisible();
  });

  test('C78 — chaque thème dit pourquoi la formation le couvre mal et comment l’apprendre plus vite', async ({ page }) => {
    await page.goto('/terrain');
    const themes = page.getByRole('main').getByRole('article');
    expect(await themes.count()).toBeGreaterThanOrEqual(6);
    for (const theme of await themes.all()) {
      await expect(theme.getByRole('heading', { level: 2 })).toBeVisible();
      await expect(theme).toContainText('En formation');
      await expect(theme).toContainText('Pour progresser');
    }
  });
});
