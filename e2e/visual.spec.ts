import { test, expect } from '@playwright/test';
import { mockPokeApi } from './fixtures/mock-api';

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

// Waits for every visible .type-icon to finish decoding. The images are
// loading="lazy" + decoding="async", so they race with the screenshot without
// this guard — producing a flaky 1324-pixel diff on the badge icons.
async function waitForTypeIcons(page: Parameters<typeof test>[1]['page']): Promise<void> {
  await page.waitForFunction(() => {
    const icons = Array.from(document.querySelectorAll<HTMLImageElement>('.type-icon'));
    return icons.length > 0 && icons.every((img) => img.complete && img.naturalWidth > 0);
  });
}

test('home page matches snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);
  await waitForTypeIcons(page);
  await expect(page).toHaveScreenshot('home.png');
});

test('detail overlay matches snapshot', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();
  // Wait for: detail image loaded, nav buttons positioned (rAF A), and overlay
  // focused (rAF B from overlay.ts). All three must be true simultaneously so
  // Playwright's stability check sees a fully-settled page. Without the
  // activeElement guard, rAF B fires between the two consecutive screenshots,
  // the card loses its browser focus ring, and backdrop-filter picks up the
  // change — causing 1327 unstable pixels.
  await page.waitForFunction(() => {
    const overlay = document.querySelector<HTMLElement>('.overlay');
    const btn = document.querySelector<HTMLElement>('.arrow-left');
    const img = document.querySelector<HTMLImageElement>('.overlay .details-image');
    if (!overlay || !btn || !img) return false;
    return (
      img.complete &&
      img.naturalWidth > 0 &&
      btn.style.top !== '' &&
      document.activeElement === overlay
    );
  });
  await expect(page).toHaveScreenshot('overlay.png', { maxDiffPixels: 2 });
});

test('search results match snapshot', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search-input', 'ivy');
  await expect(page.locator('.pokemon-card')).toHaveCount(1);
  await waitForTypeIcons(page);
  await expect(page).toHaveScreenshot('search-filtered.png');
});
