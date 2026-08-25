import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../logo.js', () => ({ initLogoAnimation: vi.fn() }));
vi.mock('../pwa-toast.js', () => ({ initPwaUpdateToast: vi.fn() }));
vi.mock('../monitoring.js', () => ({ initMonitoring: vi.fn() }));

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
    <div id="search-no-results" hidden></div>
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
    vi.useFakeTimers();
    try {
      stubFetchError(429, 'Too Many Requests');
      await loadModule();
      await vi.runAllTimersAsync();
      expect(document.querySelector('.error-message')).toBeTruthy();
      expect(document.querySelector('.error-message')?.textContent).toContain('Too many requests');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows server-error message on HTTP 5xx', async () => {
    vi.useFakeTimers();
    try {
      stubFetchError(503, 'Service Unavailable');
      await loadModule();
      await vi.runAllTimersAsync();
      expect(document.querySelector('.error-message')?.textContent).toContain(
        'temporarily unavailable',
      );
    } finally {
      vi.useRealTimers();
    }
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
      expect(document.querySelector('.pokemon-name')?.textContent).toBe('Bulbasaur');
    });
  });

  it('retry button re-triggers fetch', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Error' });
      vi.stubGlobal('fetch', fetchMock);
      await loadModule();
      await vi.runAllTimersAsync();

      expect(document.querySelector('.retry-btn')).toBeTruthy();
      const callsBefore = fetchMock.mock.calls.length;
      document.querySelector<HTMLButtonElement>('.retry-btn')?.click();
      await vi.runAllTimersAsync();

      expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore);
    } finally {
      vi.useRealTimers();
    }
  });

  it('silently ignores a logo load failure', async () => {
    vi.doMock('../logo.js', () => {
      throw new Error('simulated load failure');
    });
    stubFetchSuccess();
    vi.useFakeTimers();
    try {
      await loadModule();
      await vi.advanceTimersByTimeAsync(1100);
      expect(document.querySelector('#pokedex-container')).not.toBeNull();
    } finally {
      vi.useRealTimers();
      vi.doUnmock('../logo.js');
    }
  });

  it('silently ignores a monitoring load failure', async () => {
    vi.doMock('../monitoring.js', () => {
      throw new Error('simulated load failure');
    });
    stubFetchSuccess();
    vi.useFakeTimers();
    try {
      await loadModule();
      await vi.advanceTimersByTimeAsync(2100);
      expect(document.querySelector('#pokedex-container')).not.toBeNull();
    } finally {
      vi.useRealTimers();
      vi.doUnmock('../monitoring.js');
    }
  });
});
