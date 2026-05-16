import type { Page } from '@playwright/test';
import { BULBASAUR, IVYSAUR } from './pokemon';

export async function mockPokeApi(page: Page): Promise<void> {
  await page.route('https://pokeapi.co/api/v2/pokemon?**', (route) =>
    route.fulfill({
      json: {
        results: [
          { url: 'https://pokeapi.co/api/v2/pokemon/1/' },
          { url: 'https://pokeapi.co/api/v2/pokemon/2/' },
        ],
      },
    }),
  );
  await page.route('https://pokeapi.co/api/v2/pokemon/1/', (route) =>
    route.fulfill({ json: BULBASAUR }),
  );
  await page.route('https://pokeapi.co/api/v2/pokemon/2/', (route) =>
    route.fulfill({ json: IVYSAUR }),
  );
  await page.route(/wsrv\.nl|raw\.githubusercontent\.com/, (route) => route.abort());
}
