import { test, expect } from '@playwright/test';
import { mockPokeApi } from './fixtures/mock-api';

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

test('home page matches snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);
  await expect(page).toHaveScreenshot('home.png');
});

test('detail overlay matches snapshot', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();
  await expect(page).toHaveScreenshot('overlay.png');
});

test('search results match snapshot', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search-input', 'ivy');
  await expect(page.locator('.pokemon-card')).toHaveCount(1);
  await expect(page).toHaveScreenshot('search-filtered.png');
});
