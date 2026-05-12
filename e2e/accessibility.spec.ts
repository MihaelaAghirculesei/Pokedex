import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BULBASAUR, IVYSAUR } from './fixtures/pokemon';

async function mockPokeApi(page: Page): Promise<void> {
  await page.route('https://pokeapi.co/api/v2/pokemon?**', route =>
    route.fulfill({
      json: {
        results: [
          { url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      },
    })
  );
  await page.route('https://pokeapi.co/api/v2/pokemon/1/', route =>
    route.fulfill({ json: BULBASAUR })
  );
  await page.route('https://pokeapi.co/api/v2/pokemon/2/', route =>
    route.fulfill({ json: IVYSAUR })
  );
  await page.route(/wsrv\.nl|raw\.githubusercontent\.com/, route => route.abort());
}

test.beforeEach(async ({ page }) => {
  await mockPokeApi(page);
});

test('home page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pokemon-card')).toHaveCount(2);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('detail overlay has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('search results have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search-input', 'ivy');
  await expect(page.locator('.pokemon-card')).toHaveCount(1);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('no-results state has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.fill('#search-input', 'cha');
  await expect(page.locator('#search-no-results')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
