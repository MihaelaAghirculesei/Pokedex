import { test, expect, type Page } from '@playwright/test';
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
  // Block image requests so tests don't depend on external assets
  await page.route(/wsrv\.nl|raw\.githubusercontent\.com/, route => route.abort());
}

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

test('Escape key closes the overlay', async ({ page }) => {
  await page.goto('/');
  await page.locator('.pokemon-card').first().click();
  await expect(page.locator('.overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.overlay')).not.toBeAttached();
  await expect(page).toHaveTitle('Pokédex');
});

test('ArrowRight navigates to next Pokémon in overlay', async ({ page }) => {
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
