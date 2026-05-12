import { test, expect } from '@playwright/test';
import { mockPokeApi } from './fixtures/mock-api';

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

test('loads and displays Pokémon cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);
  await expect(page.locator('.pokemon-card').first()).toContainText('Bulbasaur');
});

test('clicking a card opens the detail overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();
  await expect(page.locator('.overlay')).toContainText('Bulbasaur');
});

test('Escape key closes the overlay', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard Escape is a desktop-only interaction');
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay')).not.toBeAttached();
  await expect(page).toHaveTitle('Pokédex');
});

test('ArrowRight navigates to next Pokémon in overlay', async ({ page, isMobile }) => {
  test.skip(isMobile, 'arrow-key navigation is a desktop-only interaction');
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toContainText('Bulbasaur');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.overlay')).toContainText('Ivysaur');
});

test('search filters cards by name', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);
  await page.fill('#search-input', 'ivy');
  await expect(page.locator('.pokemon-card')).toHaveCount(1);
  await expect(page.locator('.pokemon-card')).toContainText('Ivysaur');
});

test('search with no matches clears the grid and shows no-results message', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);
  await page.fill('#search-input', 'cha');
  await expect(page.locator('.pokemon-card')).toHaveCount(0);
  await expect(page.locator('#search-no-results')).toBeVisible();
});
