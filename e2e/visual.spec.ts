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
  // Wait for the detail image to finish loading
  await page.waitForFunction(() => {
    const img = document.querySelector<HTMLImageElement>('.overlay .details-image');
    return img?.complete && img.naturalWidth > 0;
  });
  // Wait for nav arrow buttons to be positioned (set via nested requestAnimationFrame)
  await page.waitForFunction(() => {
    const btn = document.querySelector<HTMLElement>('.arrow-left');
    return btn != null && btn.style.top !== '';
  });
  await expect(page).toHaveScreenshot('overlay.png', { maxDiffPixels: 2 });
});

test('search results match snapshot', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search-input', 'ivy');
  await expect(page.locator('.pokemon-card')).toHaveCount(1);
  await expect(page).toHaveScreenshot('search-filtered.png');
});
