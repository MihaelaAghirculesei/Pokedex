import { test, expect } from '@playwright/test';
import { mockPokeApi } from './fixtures/mock-api';

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

test.describe('Mobile viewport — PWA core flows', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile-only suite');

  test('cards are visible and fit within viewport width', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.pokemon-card')).toHaveCount(2);

    const card = page.locator('.pokemon-card').first();
    const box = await card.boundingBox();
    const viewport = page.viewportSize();

    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.width).toBeLessThanOrEqual(viewport!.width);
  });

  test('tap on card opens the detail overlay', async ({ page }) => {
    await page.goto('/');
    await page.locator('.pokemon-card').first().tap();
    await expect(page.locator('.overlay')).toBeVisible();
    await expect(page.locator('.overlay')).toContainText('Bulbasaur');
  });

  test('search filters cards on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'ivy');
    await expect(page.locator('.pokemon-card')).toHaveCount(1);
    await expect(page.locator('.pokemon-card')).toContainText('Ivysaur');
  });

  test('no-results message is visible on mobile viewport', async ({ page }) => {
    await page.goto('/');
    await page.fill('#search-input', 'cha');
    await expect(page.locator('#search-no-results')).toBeVisible();
  });
});
