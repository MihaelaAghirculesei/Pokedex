import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../state.js', () => ({
  getPokemonDetails: vi.fn(() => []),
  setCurrentOverlayPokemon: vi.fn(),
}));
vi.mock('../utils.js', () => ({
  typeColor: { grass: '#78C850' },
  getTextColorForBackground: vi.fn(() => '#000'),
}));
vi.mock('../templates.js', () => ({
  detailTemplate: vi.fn(
    (_p, h, w, ab) => `<div class="pokemon-image-section">${h}|${w}|${ab}</div>`,
  ),
}));
vi.mock('../render.js', () => ({ setHTML: vi.fn() }));
vi.mock('../tabs.js', () => ({ attachTabListeners: vi.fn() }));

import {
  createDetailsHTML,
  appendNavigationButtons,
  showPreviousPokemon,
  showNextPokemon,
} from '../navigation.js';
import { getPokemonDetails, setCurrentOverlayPokemon } from '../state.js';
import { detailTemplate } from '../templates.js';

const base = {
  id: 1,
  name: 'bulbasaur',
  height: 7, // decimetres  →  0.7 m
  weight: 69, // hectograms  →  6.9 kg
  abilities: [{ ability: { name: 'overgrow' } }, { ability: { name: 'chlorophyll' } }],
  types: [{ type: { name: 'grass' } }],
  moves: [],
  stats: [],
  sprites: { front_default: '', other: { 'official-artwork': { front_default: '' } } },
  species: { name: 'bulbasaur' },
} as const;

function make(overrides: Record<string, unknown> = {}): typeof base {
  return { ...base, ...overrides };
}

function makeOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const card = document.createElement('div');
  card.className = 'details-card';
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  return overlay;
}

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

// ─── createDetailsHTML ────────────────────────────────────────────────────────

describe('createDetailsHTML', () => {
  it('converts height from decimetres to metres with one decimal place', () => {
    createDetailsHTML(base as never);
    const [, height] = vi.mocked(detailTemplate).mock.calls[0] as Parameters<typeof detailTemplate>;
    expect(height).toBe('0.7');
  });

  it('converts weight from hectograms to kilograms with one decimal place', () => {
    createDetailsHTML(base as never);
    const [, , weight] = vi.mocked(detailTemplate).mock.calls[0] as Parameters<
      typeof detailTemplate
    >;
    expect(weight).toBe('6.9');
  });

  it('joins multiple abilities with a comma and space', () => {
    createDetailsHTML(base as never);
    const [, , , abilities] = vi.mocked(detailTemplate).mock.calls[0] as Parameters<
      typeof detailTemplate
    >;
    expect(abilities).toBe('overgrow, chlorophyll');
  });

  it('returns the string produced by detailTemplate', () => {
    const result = createDetailsHTML(base as never);
    expect(result).toContain('0.7|6.9|overgrow, chlorophyll');
  });
});

// ─── appendNavigationButtons ─────────────────────────────────────────────────

describe('appendNavigationButtons', () => {
  it('returns early without inserting buttons when .pokemon-image-section is absent', () => {
    const overlay = makeOverlay();
    const card = overlay.querySelector<HTMLElement>('.details-card') as HTMLElement;
    appendNavigationButtons(card, base as never, overlay);
    expect(card.querySelector('.arrow-button')).toBeNull();
  });

  it('appends both prev and next buttons to the overlay (not inside .pokemon-image-section)', () => {
    const overlay = makeOverlay();
    const card = overlay.querySelector<HTMLElement>('.details-card') as HTMLElement;
    const section = document.createElement('div');
    section.className = 'pokemon-image-section';
    card.appendChild(section);
    appendNavigationButtons(card, base as never, overlay);
    expect(overlay.querySelector('.arrow-button.prev')).toBeTruthy();
    expect(overlay.querySelector('.arrow-button.next')).toBeTruthy();
    expect(section.querySelector('.arrow-button')).toBeNull();
  });

  it('sets accessible aria-labels on both nav buttons', () => {
    const overlay = makeOverlay();
    const card = overlay.querySelector<HTMLElement>('.details-card') as HTMLElement;
    const section = document.createElement('div');
    section.className = 'pokemon-image-section';
    card.appendChild(section);
    appendNavigationButtons(card, base as never, overlay);
    expect((overlay.querySelector('.prev') as Element).getAttribute('aria-label')).toBe(
      'Previous Pokémon',
    );
    expect((overlay.querySelector('.next') as Element).getAttribute('aria-label')).toBe(
      'Next Pokémon',
    );
  });
});

// ─── showPreviousPokemon / showNextPokemon ────────────────────────────────────

describe('showPreviousPokemon / showNextPokemon', () => {
  const p1 = make({ id: 1, name: 'bulbasaur' });
  const p2 = make({ id: 2, name: 'ivysaur' });
  const p3 = make({ id: 3, name: 'venusaur' });

  beforeEach(() => {
    vi.mocked(getPokemonDetails).mockReturnValue([p1, p2, p3] as never);
  });

  it('showNextPokemon advances to the next pokemon in the list', () => {
    const overlay = makeOverlay();
    showNextPokemon(p1 as never, overlay);
    expect(vi.mocked(setCurrentOverlayPokemon)).toHaveBeenCalledWith(p2);
  });

  it('showNextPokemon wraps from the last pokemon back to the first', () => {
    const overlay = makeOverlay();
    showNextPokemon(p3 as never, overlay);
    expect(vi.mocked(setCurrentOverlayPokemon)).toHaveBeenCalledWith(p1);
  });

  it('showPreviousPokemon goes back to the previous pokemon in the list', () => {
    const overlay = makeOverlay();
    showPreviousPokemon(p3 as never, overlay);
    expect(vi.mocked(setCurrentOverlayPokemon)).toHaveBeenCalledWith(p2);
  });

  it('showPreviousPokemon wraps from the first pokemon back to the last', () => {
    const overlay = makeOverlay();
    showPreviousPokemon(p1 as never, overlay);
    expect(vi.mocked(setCurrentOverlayPokemon)).toHaveBeenCalledWith(p3);
  });
});
