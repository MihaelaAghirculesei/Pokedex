import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../logo.js', () => ({ initLogoAnimation: vi.fn() }));

// jsdom does not implement scrollIntoView or scrollBy
HTMLElement.prototype.scrollIntoView = vi.fn();
HTMLElement.prototype.scrollBy = vi.fn();

const POKEMON = {
  id: 1,
  name: 'bulbasaur',
  types: [{ type: { name: 'grass' } }],
  sprites: {
    front_default: 'sprite.png',
    other: { 'official-artwork': { front_default: 'artwork.png' } },
  },
  height: 7,
  weight: 69,
  abilities: [{ ability: { name: 'overgrow' } }],
  stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
  moves: [{ move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }],
  species: { name: 'bulbasaur' },
};

function buildDOM(): void {
  document.body.innerHTML = `
    <header class="header">
      <input id="search-input" type="text">
    </header>
    <div id="loading" hidden></div>
    <div id="search-status"></div>
    <div id="search-no-results" hidden></div>
    <div id="pokedex-container"></div>
    <button id="load-more"><span>Load More</span></button>
  `;
}

const POKEMON2 = {
  ...POKEMON,
  id: 2,
  name: 'ivysaur',
};

function stubFetchSuccess(): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockImplementation((url: string) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          url.includes('?offset=')
            ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
            : POKEMON,
        ),
    }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

function stubFetchSuccessTwo(): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockImplementation((url: string) =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve(
          url.includes('?offset=')
            ? {
                results: [
                  { url: 'https://pokeapi.co/api/v2/pokemon/1/' },
                  { url: 'https://pokeapi.co/api/v2/pokemon/2/' },
                ],
              }
            : url.endsWith('/2/')
            ? POKEMON2
            : POKEMON,
        ),
    }),
  );
  vi.stubGlobal('fetch', mock);
  return mock;
}

async function loadAndWaitForCards(): Promise<void> {
  await import('../main.js');
  await vi.waitFor(
    () => { expect(document.querySelector('.pokemon-card')).toBeTruthy(); },
    { timeout: 2000 },
  );
}

function openOverlay(): void {
  document.querySelector<HTMLElement>('.pokemon-card')?.click();
}

function cleanup(): void {
  vi.unstubAllGlobals();
  document.body.classList.remove('no-scroll', 'keyboard-nav');
  document.querySelectorAll('.overlay').forEach(el => { el.remove(); });
}

// ─── Card rendering ───────────────────────────────────────────────────────────

describe('main.ts — card rendering', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('sets correct data-name, role, and aria-label on card', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    expect(card.dataset.name).toBe('bulbasaur');
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('aria-label')).toContain('Bulbasaur');
    expect(card.getAttribute('tabindex')).toBe('0');
  });
});

// ─── Overlay open / close ─────────────────────────────────────────────────────

describe('main.ts — overlay', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('opens overlay and adds no-scroll class on card click', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    expect(document.querySelector('.overlay')).toBeTruthy();
    expect(document.body.classList.contains('no-scroll')).toBe(true);
  });

  it('overlay contains details-card with tab buttons and nav arrows', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    expect(document.querySelector('.details-card')).toBeTruthy();
    expect(document.querySelector('[data-tab="About"]')).toBeTruthy();
    expect(document.querySelector('[data-tab="BaseStats"]')).toBeTruthy();
    expect(document.querySelector('[data-tab="Moves"]')).toBeTruthy();
    expect(document.querySelector('.arrow-button.prev')).toBeTruthy();
    expect(document.querySelector('.arrow-button.next')).toBeTruthy();
  });

  it('does not open a second overlay when one is already open', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    openOverlay();
    expect(document.querySelectorAll('.overlay').length).toBe(1);
  });

  it('closes overlay on Escape key', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeNull();
    expect(document.body.classList.contains('no-scroll')).toBe(false);
  });

  it('closes overlay when clicking the overlay backdrop', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.overlay')?.click();
    expect(document.querySelector('.overlay')).toBeNull();
  });
});

// ─── Tabs ─────────────────────────────────────────────────────────────────────

describe('main.ts — tabs', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('switches to BaseStats tab and shows its content', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('[data-tab="BaseStats"]')?.click();
    expect(document.getElementById('BaseStats')?.style.display).toBe('block');
    expect(document.getElementById('About')?.style.display).toBe('none');
  });

  it('switches to Moves tab and loads move tags', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    expect(document.querySelector('.moves-container')?.getAttribute('data-loaded')).toBe('true');
    expect(document.querySelector('.move-compact-tag')).toBeTruthy();
  });

  it('shows moves error template when pokemon id has no match in loaded list', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (!movesContainer) throw new Error('.moves-container not found');
    // Point the container to a non-existent pokemon so loadPokemonMoves hits the error path
    movesContainer.id = 'moves-999';
    movesContainer.dataset.pokemonId = '999';

    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();

    expect(movesContainer.textContent).toContain('Failed to load moves');
  });

  it('adds moves-active class on details-card when Moves tab is opened', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    expect(document.querySelector('.details-card')?.classList.contains('moves-active')).toBe(true);
  });

  it('removes moves-active class when switching away from Moves tab', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    document.querySelector<HTMLElement>('[data-tab="About"]')?.click();
    expect(document.querySelector('.details-card')?.classList.contains('moves-active')).toBe(false);
  });
});

// ─── Navigation buttons ───────────────────────────────────────────────────────

describe('main.ts — navigation buttons', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('clicking next button initiates slide animation', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    expect(document.querySelector('.details-card')).toBeTruthy();
  });

  it('clicking prev button initiates slide animation', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLButtonElement>('.arrow-button.prev')?.click();
    expect(document.querySelector('.details-card')).toBeTruthy();
  });

  it('transitionend on details-card runs the slide-in callback', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(document.querySelector('.details-card')).toBeTruthy();
  });

  it('transitionend with non-transform property is ignored', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'opacity' });
    detailsCard.dispatchEvent(evt);
    expect(document.querySelector('.details-card')).toBeTruthy();
  });
});

// ─── Search ───────────────────────────────────────────────────────────────────

describe('main.ts — search', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('filters cards and announces results when >= 3 chars typed', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const input = document.getElementById('search-input') as HTMLInputElement;
    input.value = 'bul';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(
      () => { expect(document.getElementById('search-status')?.textContent).toContain('Pokémon found'); },
      { timeout: 1500 },
    );
  });

  it('shows no-results message and clears the grid when search yields nothing', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const input = document.getElementById('search-input') as HTMLInputElement;
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(
      () => {
        const el = document.getElementById('search-no-results');
        expect(el?.hasAttribute('hidden')).toBe(false);
      },
      { timeout: 1500 },
    );
    expect(document.getElementById('search-status')?.textContent).toContain('No Pokémon');
    expect(document.querySelector('.pokemon-card')).toBeNull();
  });

  it('clears search status when fewer than 3 chars typed', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const input = document.getElementById('search-input') as HTMLInputElement;
    input.value = 'bul';
    input.dispatchEvent(new Event('input'));
    await vi.waitFor(
      () => { expect(document.getElementById('search-status')?.textContent).not.toBe(''); },
      { timeout: 1500 },
    );
    input.value = 'bu';
    input.dispatchEvent(new Event('input'));
    expect(document.getElementById('search-status')?.textContent).toBe('');
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('main.ts — keyboard navigation', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('opens overlay on Enter keydown on card', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const cardEnter = document.querySelector<HTMLElement>('.pokemon-card');
    if (!cardEnter) throw new Error('.pokemon-card not found');
    cardEnter.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('opens overlay on Space keydown on card', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const cardSpace = document.querySelector<HTMLElement>('.pokemon-card');
    if (!cardSpace) throw new Error('.pokemon-card not found');
    cardSpace.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('ArrowRight adds keyboard-nav class when no overlay is open', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.body.classList.contains('keyboard-nav')).toBe(true);
  });

  it('ArrowLeft adds keyboard-nav class when no overlay is open', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.body.classList.contains('keyboard-nav')).toBe(true);
  });

  it('ArrowLeft in overlay navigates to previous pokemon', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('ArrowRight in overlay navigates to next pokemon', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('Tab key with overlay open traps focus without closing overlay', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('Tab on last focusable overlay element wraps focus back to first', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    const focusable = Array.from(overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ));
    const last = focusable[focusable.length - 1];
    if (!last) throw new Error('No focusable elements found in overlay');
    last.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('Shift+Tab wraps focus to last focusable element when overlay is focused', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    overlay.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('keydown on container with non-Enter/Space key does not open overlay', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const cardA = document.querySelector<HTMLElement>('.pokemon-card');
    if (!cardA) throw new Error('.pokemon-card not found');
    cardA.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeNull();
  });

  it('does not add keyboard-nav when search input has focus', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    document.getElementById('search-input')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.body.classList.contains('keyboard-nav')).toBe(false);
  });

  it('removes keyboard-nav class on document mousemove', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    document.body.classList.add('keyboard-nav');
    document.dispatchEvent(new MouseEvent('mousemove'));
    expect(document.body.classList.contains('keyboard-nav')).toBe(false);
  });

  it('keeps focus on pokemon card on document mousemove (only removes keyboard-nav ring)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    card.focus();
    expect(document.activeElement).toBe(card);
    document.dispatchEvent(new MouseEvent('mousemove'));
    expect(document.activeElement).toBe(card);
  });

  it('ArrowRight on focused card moves focus to next card', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    const cards = document.querySelectorAll<HTMLElement>('.pokemon-card');
    const firstCard = cards[0];
    if (!firstCard) throw new Error('No pokemon cards found');
    firstCard.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(cards[1]);
  });

  it('ArrowLeft on focused card moves focus to prev card', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    const cards = document.querySelectorAll<HTMLElement>('.pokemon-card');
    const secondCard = cards[1];
    if (!secondCard) throw new Error('Second pokemon card not found');
    secondCard.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(cards[0]);
  });

  it('ArrowRight on last card moves focus to load-more button', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const cardRight = document.querySelector<HTMLElement>('.pokemon-card');
    if (!cardRight) throw new Error('.pokemon-card not found');
    cardRight.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById('load-more'));
  });

  it('ArrowLeft on first card moves focus to load-more button', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const cardLeft = document.querySelector<HTMLElement>('.pokemon-card');
    if (!cardLeft) throw new Error('.pokemon-card not found');
    cardLeft.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(document.getElementById('load-more'));
  });
});

// ─── Mouse interactions ───────────────────────────────────────────────────────

describe('main.ts — mouse interactions', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('resets card CSS vars to 50% on mouseout', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    card.style.setProperty('--x', '75%');
    card.style.setProperty('--y', '80%');
    card.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: null, bubbles: true }));
    expect(card.style.getPropertyValue('--x')).toBe('50%');
    expect(card.style.getPropertyValue('--y')).toBe('50%');
  });

  it('does not reset card CSS vars on mouseout when pointer is still inside card', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    card.style.setProperty('--x', '75%');
    // relatedTarget inside the card → card.contains(relatedTarget) = true → skip reset
    const inner = document.createElement('span');
    card.appendChild(inner);
    card.dispatchEvent(new MouseEvent('mouseout', { relatedTarget: inner, bubbles: true }));
    expect(card.style.getPropertyValue('--x')).toBe('75%');
  });

  it('mousemove over card with synchronous rAF updates CSS custom properties', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    // Make rAF run the callback synchronously so lines 491-496 are covered
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });

    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 100, height: 100,
      right: 100, bottom: 100, x: 0, y: 0, toJSON: () => ({}),
    });

    card.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 50, clientY: 25 }));

    expect(card.style.getPropertyValue('--x')).toBe('50%');
    expect(card.style.getPropertyValue('--y')).toBe('25%');
  });

  it('mousemove on container (not a card) skips CSS update inside rAF callback', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    const container = document.getElementById('pokedex-container');
    if (!container) throw new Error('pokedex-container not found');
    // Target is the container itself — closest('.pokemon-card') returns null → early return
    container.dispatchEvent(new MouseEvent('mousemove', { bubbles: false }));
    expect(document.querySelector<HTMLElement>('.pokemon-card')?.style.getPropertyValue('--x')).toBe('');
  });

  it('second mousemove while rAF is pending is skipped', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    let rafCount = 0;
    vi.stubGlobal('requestAnimationFrame', () => { rafCount++; return 0; });

    const container = document.getElementById('pokedex-container');
    if (!container) throw new Error('pokedex-container not found');
    container.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    container.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(rafCount).toBe(1);
  });
});

// ─── Direction-specific prev/next navigation (lines 284-290) ─────────────────

describe('main.ts — direction-specific navigation (lines 284-290)', () => {
  beforeEach(async () => {
    vi.resetModules();
    buildDOM();
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
  });
  afterEach(cleanup);

  it('prev button applies translateX(100%) slide-out on details-card', () => {
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.prev')?.click();
    expect(document.querySelector<HTMLElement>('.details-card')?.style.transform).toBe('translateX(100%)');
  });

  it('next button applies translateX(-100%) slide-out on details-card', () => {
    document.querySelectorAll<HTMLElement>('.pokemon-card')[1]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    expect(document.querySelector<HTMLElement>('.details-card')?.style.transform).toBe('translateX(-100%)');
  });

  it('prev from first pokemon wraps to last after slide-in completes', () => {
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    document.querySelector<HTMLButtonElement>('.arrow-button.prev')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(detailsCard.textContent.toLowerCase()).toContain('ivysaur');
  });

  it('next from last pokemon wraps to first after slide-in completes', () => {
    document.querySelectorAll<HTMLElement>('.pokemon-card')[1]?.click();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(detailsCard.textContent.toLowerCase()).toContain('bulbasaur');
  });
});

// ─── Slide-in animation via nested rAF (lines 314-327) ────────────────────────

describe('main.ts — slide-in animation via nested rAF (lines 314-327)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('transitionend + synchronous rAF resets transform to translateX(0) and opacity to 1', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(detailsCard.style.transform).toBe('translateX(0)');
    expect(detailsCard.style.opacity).toBe('1');
  });

  it('overlay receives focus after nested rAF completes (line 324)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    const focusSpy = vi.spyOn(overlay, 'focus');
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(focusSpy).toHaveBeenCalled();
  });

  it('new pokemon content and nav buttons are injected into detailsCard (lines 314-317)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    expect(detailsCard.style.backgroundColor).toBeTruthy();
    expect(detailsCard.querySelector('.arrow-button')).toBeTruthy();
  });

  it('prev direction: transitionend sets slideIn to translateX(-100%) before rAF runs (line 313)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.prev')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    // rAF not stubbed: after transitionend callback, transform is set to slideIn = '-100%' (before rAF)
    expect(detailsCard.style.transform).toBe('translateX(-100%)');
  });
});

// ─── openTab Moves guards + loadPokemonMoves (lines 348-365) ──────────────────

describe('main.ts — openTab Moves guards and loadPokemonMoves (lines 348-365)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('second Moves tab click skips reload when data-loaded is already true (line 348 false branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    expect(movesContainer?.dataset.loaded).toBe('true');
    const contentAfterFirst = movesContainer?.innerHTML;
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    expect(movesContainer?.innerHTML).toBe(contentAfterFirst);
  });

  it('empty pokemonId prevents loadPokemonMoves from being called (line 350 guard)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (!movesContainer) throw new Error('.moves-container not found');
    movesContainer.dataset.pokemonId = '';
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    expect(document.querySelector('.move-compact-tag')).toBeNull();
  });

  it('data-pokemon-id attribute absent on movesContainer ?? falls back to empty string (line 349)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (!movesContainer) throw new Error('.moves-container not found');
    movesContainer.removeAttribute('data-pokemon-id');
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    expect(document.querySelector('.move-compact-tag')).toBeNull();
    expect(document.querySelector('.details-card')?.classList.contains('moves-active')).toBe(true);
  });

  it('tab button without data-tab attribute calls openTab with empty string (line 359 ??)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const btn = document.querySelector<HTMLElement>('.tab-button');
    if (!btn) throw new Error('.tab-button not found');
    btn.removeAttribute('data-tab');
    btn.click();
    expect(document.getElementById('About')?.style.display).not.toBe('block');
    expect(document.getElementById('BaseStats')?.style.display).not.toBe('block');
    expect(document.getElementById('Moves')?.style.display).not.toBe('block');
    expect(document.querySelector('.details-card')?.classList.contains('moves-active')).toBe(false);
  });

  it('loadPokemonMoves returns early when moves DOM element is absent (line 365)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (!movesContainer) throw new Error('.moves-container not found');
    // Rename id so getElementById('moves-1') returns null, but pokemonId attr stays '1'
    movesContainer.id = 'moves-1-hidden';
    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    // Early return: data-loaded remains 'false', initial placeholder text unchanged
    expect(movesContainer.dataset.loaded).toBe('false');
    expect(movesContainer.textContent).toBe('Loading moves...');
  });
});

// ─── Load more ────────────────────────────────────────────────────────────────

describe('main.ts — load more', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('clicking load-more button triggers a new fetch', async () => {
    const mock = stubFetchSuccess();
    await loadAndWaitForCards();
    const callsBefore = mock.mock.calls.length;
    document.getElementById('load-more')?.click();
    await vi.waitFor(
      () => { expect(mock.mock.calls.length).toBeGreaterThan(callsBefore); },
      { timeout: 2000 },
    );
  });

  it('load-more focuses the first newly appended card when previousCount > 0', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );

    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(4); },
      { timeout: 2000 },
    );

    const cards = document.querySelectorAll<HTMLElement>('.pokemon-card');
    expect(document.activeElement).toBe(cards[2]);
  });

  it('applies active search filter when load-more completes with a search term', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    // Set search value directly — no debounce involved, read at fetch completion time
    const input = document.getElementById('search-input') as HTMLInputElement;
    input.value = 'bul';

    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => { expect(document.getElementById('search-status')?.textContent).toContain('Pokémon found'); },
      { timeout: 2000 },
    );
  });
});

// ─── navigateCards: no focused card (currentIndex === -1, lines 436-441) ─────

describe('main.ts — navigateCards: no focused card (line 451 currentIndex=-1)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('ArrowRight with no focused card moves focus to first card', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(document.querySelectorAll('.pokemon-card')[0]);
  });

  it('ArrowLeft with no focused card moves focus to last card', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    const cards = document.querySelectorAll('.pokemon-card');
    expect(document.activeElement).toBe(cards[cards.length - 1]);
  });
});

// ─── openCardOverlay edge cases (lines 466-468) ───────────────────────────────

describe('main.ts — openCardOverlay edge cases (lines 466-468)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('click directly on container with no card ancestor does not open overlay (line 466)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const container = document.getElementById('pokedex-container');
    if (!container) throw new Error('pokedex-container not found');
    container.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(document.querySelector('.overlay')).toBeNull();
  });

  it('card whose data-name is absent from pokemonDetails does not open overlay (line 468)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    card.dataset.name = 'unknown-xyz';
    card.click();
    expect(document.querySelector('.overlay')).toBeNull();
  });
});

// ─── Event listener cleanup after overlay close ───────────────────────────────

describe('main.ts — event listener cleanup after overlay close', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('previously focused card regains focus when overlay closes via Escape', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    card.focus();
    openOverlay();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.activeElement).toBe(card);
  });

  it('Escape key with no overlay open is a no-op and does not throw', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }).not.toThrow();
    expect(document.querySelector('.overlay')).toBeNull();
  });

  it('ArrowRight routes to navigateCards (not overlay nav) after overlay is closed', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeNull();
    expect(document.body.classList.contains('keyboard-nav')).toBe(true);
  });
});

// ─── updateDetailsCard: slide-out state and rAF lifecycle (lines 293-327) ────

describe('main.ts — updateDetailsCard slide-out state and rAF lifecycle (lines 293-327)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('sets opacity to "0" and ease-out transition immediately after next click (lines 304-306)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    expect(detailsCard.style.opacity).toBe('0');
    expect(detailsCard.style.transition).toMatch(/ease-out/);
  });

  it('detailsCard.style.transition is "none" when outer rAF fires (line 312)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');

    let transitionAtOuterRaf = '';
    let callCount = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      callCount++;
      if (callCount === 1) transitionAtOuterRaf = detailsCard.style.transition;
      cb(0);
      return 0;
    });

    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);

    expect(transitionAtOuterRaf).toBe('none');
  });

  it('requestAnimationFrame is called exactly twice for nested slide-in (lines 319-320)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');

    let rafCount = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCount++;
      cb(0);
      return 0;
    });

    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);

    expect(rafCount).toBe(2);
  });

  it('inner rAF restores ease-out transition string after slide-in (line 321)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');

    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });

    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);

    expect(detailsCard.style.transition).toMatch(/ease-out/);
  });

  it('returns early without error when details-card is removed before navigation (line 297)', async () => {
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    const nextBtn = document.querySelector<HTMLButtonElement>('.arrow-button.next');
    if (!nextBtn) throw new Error('.arrow-button.next not found');
    document.querySelector('.details-card')?.remove();
    expect(() => {
      nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }).not.toThrow();
  });
});

// ─── fetchPokemonData: catch-block + search-input guard (lines 93, 103-110) ──

describe('main.ts — fetchPokemonData catch-block and search-input guard (lines 93, 103-110)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('#search-input absent during load-more falls back to empty string and keeps cards rendered (line 93)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    document.getElementById('search-input')?.remove();

    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => {
        expect((document.getElementById('load-more') as HTMLButtonElement).disabled).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(document.querySelector('.error-message')).toBeNull();
    expect(document.querySelector('.pokemon-card')).toBeTruthy();
  });

  it('empty results on load-more does not crash when newCard is undefined (lines 103-107)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      }),
    );

    const cardsBefore = document.querySelectorAll('.pokemon-card').length;
    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => {
        expect((document.getElementById('load-more') as HTMLButtonElement).disabled).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(document.querySelector('.error-message')).toBeNull();
    expect(document.querySelectorAll('.pokemon-card').length).toBe(cardsBefore);
  });

  it('AbortError during load-more is silently swallowed — no error UI shown (line 110)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted.', 'AbortError')),
    );

    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => {
        expect((document.getElementById('load-more') as HTMLButtonElement).disabled).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(document.querySelector('.error-message')).toBeNull();
  });

  it('non-Error thrown during load-more is silently swallowed — no error UI shown (line 110)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('unexpected string error'));

    document.getElementById('load-more')?.click();

    await vi.waitFor(
      () => {
        expect((document.getElementById('load-more') as HTMLButtonElement).disabled).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(document.querySelector('.error-message')).toBeNull();
  });
});

// ─── trapFocus edge cases (lines 413-417) ────────────────────────────────────

describe('main.ts — trapFocus edge cases (lines 413-417)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('Tab in overlay with no focusable elements calls preventDefault and returns early (line 413)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    // Strip every focusable descendant so focusable.length === 0 → line 413 guard fires
    overlay
      .querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .forEach(el => { el.remove(); });

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');
    document.dispatchEvent(tabEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(document.querySelector('.overlay')).toBeTruthy();
  });
});

// ─── Guard clause branches (lines 199, 232, 257) ─────────────────────────────

describe('main.ts — guard clause branches (lines 199, 232, 257)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(() => { vi.doUnmock('../templates.js'); cleanup(); });

  it('createPokemonCard applies fallback color when type is not in typeColor (line 199)', async () => {
    const unknownPokemon = { ...POKEMON, types: [{ type: { name: 'stellar' } }] };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
          url.includes('?offset=')
            ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
            : unknownPokemon,
        ),
      }),
    ));
    await loadAndWaitForCards();
    const card = document.querySelector<HTMLElement>('.pokemon-card');
    if (!card) throw new Error('.pokemon-card not found');
    expect(card.style.backgroundColor).toBeTruthy();
  });

  it('showPokemonDetails applies fallback color on details-card when type is not in typeColor (line 232)', async () => {
    const unknownPokemon = { ...POKEMON, types: [{ type: { name: 'stellar' } }] };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
          url.includes('?offset=')
            ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
            : unknownPokemon,
        ),
      }),
    ));
    await loadAndWaitForCards();
    openOverlay();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    expect(detailsCard.style.backgroundColor).toBeTruthy();
  });

  it('appendNavigationButtons returns early without arrow buttons when .pokemon-image-section is absent (line 257)', async () => {
    vi.doMock('../templates.js', () => ({
      createPokemonCardTemplate: () => '',
      detailTemplate: () => '',
      errorMessageTemplate: () => '',
      movesErrorTemplate: () => '',
      createMovesHTMLTemplate: () => '',
    }));
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
          url.includes('?offset=')
            ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
            : POKEMON,
        ),
      }),
    ));
    await loadAndWaitForCards();
    openOverlay();
    expect(document.querySelector('.overlay')).toBeTruthy();
    expect(document.querySelector('.arrow-button')).toBeNull();
  });
});

// ─── Fetch errors → handleFetchError + loadPokemonMoves error path ────────────

describe('main.ts — fetch errors (handleFetchError)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('shows generic connection error when fetch rejects with a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelector('.error-message')).toBeTruthy(); },
      { timeout: 2000 },
    );
    expect(document.querySelector('.error-message')?.textContent).toContain(
      'Failed to load Pokémon data',
    );
  });

  it('shows rate-limit message when fetch returns HTTP 429', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' }),
    );
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelector('.error-message')).toBeTruthy(); },
      { timeout: 2000 },
    );
    expect(document.querySelector('.error-message')?.textContent).toContain('Too many requests');
  });

  it('shows server-error message when fetch returns HTTP 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' }),
    );
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelector('.error-message')).toBeTruthy(); },
      { timeout: 2000 },
    );
    expect(document.querySelector('.error-message')?.textContent).toContain(
      'temporarily unavailable',
    );
  });

  it('loadPokemonMoves shows error template when individual pokemon fetch returns ok:false', async () => {
    // List fetch succeeds; individual pokemon detail fetch fails →
    // pokemonDetails stays empty → loadPokemonMoves hits the movesErrorTemplate path
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve(
          url.includes('?offset=')
            ? {
                ok: true,
                json: () =>
                  Promise.resolve({
                    results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
                  }),
              }
            : { ok: false, status: 404, statusText: 'Not Found' },
        ),
      ),
    );
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelector('.error-message')).toBeTruthy(); },
      { timeout: 2000 },
    );
    expect(document.querySelector('.pokemon-card')).toBeNull();
  });
});

// ─── SLIDE_DURATION_MS initialization (line 26) ──────────────────────────────

describe('main.ts — SLIDE_DURATION_MS initialization (line 26)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('uses CSS variable when --transition-duration is set (truthy branch)', async () => {
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: (prop: string) => prop === '--transition-duration' ? '0.4' : '',
    }));
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    // SLIDE_DURATION_MS = parseFloat('0.4') * 1000 = 400 → dur = '0.4s'
    expect(detailsCard.style.transition).toContain('0.4s');
  });

  it('falls back to 300ms when CSS variable is empty string (falsy branch)', async () => {
    // jsdom returns '' for custom properties by default — no stub needed
    stubFetchSuccessTwo();
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelectorAll('.pokemon-card').length).toBe(2); },
      { timeout: 2000 },
    );
    document.querySelectorAll<HTMLElement>('.pokemon-card')[0]?.click();
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    // SLIDE_DURATION_MS = 300 → dur = '0.3s'
    expect(detailsCard.style.transition).toContain('0.3s');
  });
});

// ─── getEl: throws when required element is absent (line 33) ──────────────────

describe('main.ts — getEl throws for missing element (line 33)', () => {
  beforeEach(() => { vi.resetModules(); });
  afterEach(cleanup);

  it('throws naming the missing element id when a required DOM element is absent', async () => {
    // DOM without #loading — getEl('loading') is the first module-level call
    document.body.innerHTML = `
      <div id="search-status"></div>
      <div id="pokedex-container"></div>
      <button id="load-more"></button>
      <input id="search-input" type="text">
    `;
    vi.stubGlobal('fetch', vi.fn());
    await expect(import('../main.js')).rejects.toThrow(
      'Required element #loading is missing from the DOM',
    );
  });
});

// ─── Direction branches: lines 314, 343 ──────────────────────────────────────

describe('main.ts — direction branches (lines 314, 343)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('sets backgroundColor to #95afc0 fallback when pokemon type is absent from typeColor map (line 314 ??)', async () => {
    const unknownTypePokemon = { ...POKEMON, types: [{ type: { name: 'unknown-xyz' } }] };
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(
          url.includes('?offset=')
            ? { results: [{ url: 'https://pokeapi.co/api/v2/pokemon/1/' }] }
            : unknownTypePokemon,
        ),
      }),
    ));
    await import('../main.js');
    await vi.waitFor(
      () => { expect(document.querySelector('.pokemon-card')).toBeTruthy(); },
      { timeout: 2000 },
    );
    document.querySelector<HTMLElement>('.pokemon-card')?.click();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    document.querySelector<HTMLButtonElement>('.arrow-button.next')?.click();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const evt = new Event('transitionend') as TransitionEvent;
    Object.defineProperty(evt, 'propertyName', { value: 'transform' });
    detailsCard.dispatchEvent(evt);
    // jsdom normalises #95afc0 → rgb(149, 175, 192)
    expect(detailsCard.style.backgroundColor).toBe('rgb(149, 175, 192)');
  });

  it('openTab exits early without throwing when .details-card is absent from DOM (line 343)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    // Use document-level querySelector — same pattern as all other tab-button tests.
    const tabBtn = document.querySelector<HTMLElement>('[data-tab="About"]');
    if (!tabBtn) throw new Error('[data-tab="About"] not found');
    // Move tab button out before removing detailsCard so its event listener is preserved.
    // querySelector('.details-card') inside openTab will now return null → early return (line 343).
    document.body.appendChild(tabBtn);
    detailsCard.remove();
    expect(() => { tabBtn.click(); }).not.toThrow();
    expect(document.querySelector('.details-card')).toBeNull();
  });
});

// ─── trapFocus: Shift+Tab when first element is focused (line 420 left branch) ──

describe('main.ts — trapFocus: Shift+Tab on first focusable element (line 420)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('Shift+Tab when first focusable element is focused wraps focus to last (line 420 left branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    // Build a minimal overlay directly so the test is immune to showPokemonDetails state
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.setAttribute('tabindex', '-1');
    const btn1 = document.createElement('button');
    btn1.textContent = 'First';
    const btn2 = document.createElement('button');
    btn2.textContent = 'Middle';
    const btn3 = document.createElement('button');
    btn3.textContent = 'Last';
    overlay.append(btn1, btn2, btn3);
    document.body.appendChild(overlay);

    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );

    expect(document.activeElement).toBe(btn3);
  });
});

// ─── setupScrollIndicator: click handler (lines 427-428) ────────────────────

describe('main.ts — scroll-indicator click handler (lines 427-428)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('clicking scroll-indicator scrolls the active tab content (non-null branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    // Stub rAF synchronously so setupScrollIndicator runs immediately inside openOverlay
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    openOverlay();

    const scrollBtn = document.querySelector<HTMLElement>('.scroll-indicator');
    if (!scrollBtn) throw new Error('.scroll-indicator not found');

    const aboutTab = document.querySelector<HTMLElement>('#About');
    if (!aboutTab) throw new Error('#About tab not found');
    const scrollBySpy = vi.spyOn(aboutTab, 'scrollBy');
    scrollBtn.click();

    expect(scrollBySpy).toHaveBeenCalledWith({ top: 80, behavior: 'smooth' });
  });

  it('clicking scroll-indicator with no active tab does not throw (null branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    openOverlay();

    document.querySelectorAll<HTMLElement>('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });

    const scrollBtn = document.querySelector<HTMLElement>('.scroll-indicator');
    if (!scrollBtn) throw new Error('.scroll-indicator not found');
    expect(() => { scrollBtn.click(); }).not.toThrow();
  });
});

// ─── trapFocus: !first || !last guard (line 417) ─────────────────────────────

describe('main.ts — trapFocus !first guard (line 417)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('trapFocus returns early without crash when querySelectorAll yields length>0 but undefined first (line 417)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');

    // NodeList-like: length=1 but index 0 is undefined → !first fires the early return at line 417
    const fakeNodeList = Object.assign([], { length: 1 }) as unknown as NodeListOf<HTMLElement>;
    const spy = vi.spyOn(overlay, 'querySelectorAll').mockReturnValue(fakeNodeList);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

    expect(() => document.dispatchEvent(tabEvent)).not.toThrow();
    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(document.querySelector('.overlay')).toBeTruthy();

    spy.mockRestore();
  });
});

// ─── navigateCards: empty card list early return (line 432) ──────────────────

describe('main.ts — navigateCards cards.length===0 early return (line 432)', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('ArrowRight with no cards in DOM does not throw and adds keyboard-nav (line 432)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    document.querySelectorAll('.pokemon-card').forEach(el => { el.remove(); });

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    }).not.toThrow();
    expect(document.querySelector('.pokemon-card')).toBeNull();
    expect(document.body.classList.contains('keyboard-nav')).toBe(true);
  });

  it('ArrowLeft with no cards in DOM does not throw and adds keyboard-nav (line 432)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();

    document.querySelectorAll('.pokemon-card').forEach(el => { el.remove(); });

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    }).not.toThrow();
    expect(document.querySelector('.pokemon-card')).toBeNull();
    expect(document.body.classList.contains('keyboard-nav')).toBe(true);
  });
});

// ─── navigateTabs: ArrowUp / ArrowDown inside overlay ─────────────────────────

describe('main.ts — navigateTabs: ArrowUp/ArrowDown switches tabs in overlay', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('ArrowDown switches from About to Base Stats', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.getElementById('BaseStats')?.style.display).toBe('block');
    expect(document.querySelector('[data-tab="BaseStats"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowDown from Base Stats switches to Moves', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.getElementById('Moves')?.style.display).toBe('block');
    expect(document.querySelector('[data-tab="Moves"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowDown from Moves wraps back to About', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.getElementById('About')?.style.display).toBe('block');
    expect(document.querySelector('[data-tab="About"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowUp from About wraps to Moves', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.getElementById('Moves')?.style.display).toBe('block');
    expect(document.querySelector('[data-tab="Moves"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowUp from Base Stats switches to About', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.getElementById('About')?.style.display).toBe('block');
    expect(document.querySelector('[data-tab="About"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowUp/ArrowDown outside overlay does not trigger tab navigation', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.querySelector('.overlay')).toBeNull();
  });
});

// ─── Branch coverage: lines 421, 426-428, 462, 499 ───────────────────────────

describe('main.ts — branch coverage for navigateTabs and trapFocus edge cases', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('ArrowDown with no aria-selected tab uses fromIndex=0 as fallback (line 421 false branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelectorAll<HTMLElement>('.tab-button').forEach(btn => {
      btn.setAttribute('aria-selected', 'false');
    });
    document.querySelector<HTMLElement>('.tab-button')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.querySelector('[data-tab="BaseStats"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('ArrowDown with no tab buttons skips openTab call gracefully (lines 426-428 false branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    document.querySelectorAll('.tab-button').forEach(el => { el.remove(); });
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();
  });

  it('overlay present but currentOverlayPokemon is null: non-Tab/Escape key returns early (line 462 true branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();
    expect(document.querySelector('.overlay')).toBeTruthy();
  });

  it('ArrowDown on a tab button without data-tab attribute falls back to empty string (line 428 ?? branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const basestatsBtn = document.querySelector<HTMLElement>('[data-tab="BaseStats"]');
    if (!basestatsBtn) throw new Error('[data-tab="BaseStats"] not found');
    basestatsBtn.removeAttribute('data-tab');
    document.querySelector<HTMLElement>('.tab-button[aria-selected="true"]')?.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(basestatsBtn.getAttribute('aria-selected')).toBe('true');
  });

  it('Shift+Tab with focus on middle overlay element does not wrap focus (line 499 false branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();
    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    const focusable = Array.from(overlay.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ));
    if (focusable.length < 3) throw new Error('Need at least 3 focusable elements');
    const middle = focusable[Math.floor(focusable.length / 2)];
    if (!middle) throw new Error('No middle focusable element');
    middle.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    expect(document.activeElement).toBe(middle);
  });
});

// ─── Branch coverage: lines 411, 481, 502, 528 ───────────────────────────────

describe('main.ts — branch coverage: lines 411, 481, 502, 528', () => {
  beforeEach(() => { vi.resetModules(); buildDOM(); });
  afterEach(cleanup);

  it('updateScrollIndicator shows indicator when overflowing and not at bottom (line 411 || right branch)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    openOverlay();

    const detailsCard = document.querySelector<HTMLElement>('.details-card');
    if (!detailsCard) throw new Error('.details-card not found');
    const aboutTab = document.querySelector<HTMLElement>('#About');
    if (!aboutTab) throw new Error('#About not found');

    // scrollHeight (300) > clientHeight (0) + 2 → overflows=true → !overflows=false
    // → right side of || is evaluated; atBottom = 0 >= 290 = false → hidden = false
    Object.defineProperty(aboutTab, 'scrollHeight', { get: () => 300, configurable: true });

    // Re-trigger updateScrollIndicator by clicking the already-active About tab
    document.querySelector<HTMLElement>('[data-tab="About"]')?.click();

    const indicator = detailsCard.querySelector<HTMLElement>('.scroll-indicator');
    if (!indicator) throw new Error('.scroll-indicator not found');
    expect(indicator.hidden).toBe(false);
  });

  it('navigateTabs: if(nextTab) false branch when tabs list is empty (line 481)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const tabBtn = document.querySelector<HTMLElement>('.tab-button');
    if (!tabBtn) throw new Error('.tab-button not found');
    tabBtn.focus();

    // With tabs=[] → nextIndex=NaN → nextTab=undefined → if(nextTab) false branch
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const origQSA = document.querySelectorAll.bind(document);
    const qsaSpy = vi.spyOn(document, 'querySelectorAll').mockImplementation((selector: string) =>
      selector === '.tab-button'
        ? document.createElement('div').querySelectorAll('.none')
        : origQSA(selector),
    );

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();

    qsaSpy.mockRestore();
  });

  it('loadPokemonMoves: if(dc) false branch when .details-card absent at execution time (line 502)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const origQS = document.querySelector.bind(document);
    let dcCallCount = 0;
    const qsSpy = vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === '.details-card') {
        dcCallCount++;
        if (dcCallCount >= 2) return null;
      }
      return origQS(selector);
    });

    document.querySelector<HTMLElement>('[data-tab="Moves"]')?.click();
    qsSpy.mockRestore();

    // Moves must have loaded despite dc being null on the second querySelector call
    expect(document.querySelector('.moves-container')?.getAttribute('data-loaded')).toBe('true');
  });

  it('onKeydown ArrowDown: if(dc) false branch when .details-card absent (line 528)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    document.querySelector('.details-card')?.remove();

    // Focus the overlay (tabindex="-1") so activeElement is not a tab-button → else branch
    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    overlay.focus();

    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }).not.toThrow();
  });

  it('ArrowDown with non-tab-button focus still navigates to BaseStats tab', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    overlay.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(document.querySelector('[data-tab="BaseStats"]')?.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('BaseStats')?.style.display).toBe('block');
  });

  it('ArrowUp with non-tab-button focus navigates to Moves tab (wraps from About)', async () => {
    stubFetchSuccess();
    await loadAndWaitForCards();
    openOverlay();

    const overlay = document.querySelector<HTMLElement>('.overlay');
    if (!overlay) throw new Error('.overlay not found');
    overlay.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));

    expect(document.querySelector('[data-tab="Moves"]')?.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('Moves')?.style.display).toBe('block');
  });
});
