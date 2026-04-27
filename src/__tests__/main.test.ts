import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../logo.js', () => ({ initLogoAnimation: vi.fn() }));

const POKEMON = {
  id: 1,
  name: 'bulbasaur',
  types: [{ type: { name: 'grass' } }],
  sprites: { front_default: null, other: { 'official-artwork': { front_default: null } } },
  height: 7,
  weight: 69,
  abilities: [{ ability: { name: 'overgrow' } }],
  stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
  moves: [],
  species: { name: 'bulbasaur' },
};

function buildDOM(): void {
  document.body.innerHTML = `
    <header class="header">
      <button id="languageToggle" class="language-toggle en">
        <span class="lang-label">DE</span>
        <div class="slider"></div>
        <span class="lang-label active">EN</span>
      </button>
      <input id="search-input" type="text">
    </header>
    <div id="loading" hidden>Loading...</div>
    <div id="search-status"></div>
    <div id="pokedex-container"></div>
    <button id="load-more"><span>Load More Pokémon</span></button>
    <footer class="footer"></footer>
  `;
}

function stubFetchError(status: number, statusText = 'Error'): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status, statusText }));
}

function stubFetchNetworkError(): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
}

function stubFetchSuccess(): void {
  // mockImplementation (not Once) so stacked DOMContentLoaded listeners from
  // earlier tests don't consume the responses before the current test's listener runs.
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.includes('?offset=')
              ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
              : POKEMON,
          ),
      }),
    ),
  );
}

async function loadModule(): Promise<void> {
  await import('../main.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

describe('main.ts — fetch error handling', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    buildDOM();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows rate-limit message on HTTP 429', async () => {
    stubFetchError(429, 'Too Many Requests');
    await loadModule();

    await vi.waitFor(() => {
      expect(document.querySelector('.error-message')).toBeTruthy();
      expect(document.querySelector('.error-message')?.textContent).toContain('Too many requests');
    });
  });

  it('shows server-error message on HTTP 5xx', async () => {
    stubFetchError(503, 'Service Unavailable');
    await loadModule();

    await vi.waitFor(() => {
      expect(document.querySelector('.error-message')?.textContent).toContain(
        'temporarily unavailable',
      );
    });
  });

  it('shows network-error message when fetch throws TypeError', async () => {
    stubFetchNetworkError();
    await loadModule();

    await vi.waitFor(() => {
      expect(document.querySelector('.error-message')).toBeTruthy();
      expect(document.querySelector('.error-message')?.textContent).toContain('connection');
    });
  });

  it('renders pokemon cards on successful fetch', async () => {
    stubFetchSuccess();
    await loadModule();

    await vi.waitFor(() => {
      expect(document.querySelector('.pokemon-card')).toBeTruthy();
      expect(document.querySelector('.pokemon-name')?.textContent).toBe('bulbasaur');
    });
  });

  it('retry button re-triggers fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Error' });
    vi.stubGlobal('fetch', fetchMock);
    await loadModule();

    await vi.waitFor(() => {
      expect(document.querySelector('.retry-btn')).toBeTruthy();
    });

    const callsBefore = fetchMock.mock.calls.length;
    document.querySelector<HTMLButtonElement>('.retry-btn')?.click();

    await vi.waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
