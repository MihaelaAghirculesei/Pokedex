import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../state.js', () => ({ getPokemonDetails: vi.fn(() => []) }));
vi.mock('../render.js', () => ({ setHTML: vi.fn() }));
vi.mock('../templates.js', () => ({
  movesErrorTemplate: vi.fn(() => '<p>error</p>'),
  createMovesHTMLTemplate: vi.fn(() => '<span class="move-compact-tag">tackle</span>'),
}));

import { openTab, attachTabListeners, navigateTabs, loadPokemonMoves } from '../tabs.js';
import { getPokemonDetails } from '../state.js';
import { createMovesHTMLTemplate, movesErrorTemplate } from '../templates.js';
import { setHTML } from '../render.js';

const POKEMON = {
  id: 1,
  name: 'bulbasaur',
  moves: [{ move: { name: 'tackle' } }],
  types: [{ type: { name: 'grass' } }],
};

function getCard(): HTMLElement {
  return document.querySelector<HTMLElement>('.details-card') as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPokemonDetails).mockReturnValue([POKEMON] as never);
  document.body.innerHTML = `
    <div class="details-card">
      <button class="tab-button active" data-tab="About"      aria-selected="true"></button>
      <button class="tab-button"        data-tab="BaseStats"  aria-selected="false"></button>
      <button class="tab-button"        data-tab="Moves"      aria-selected="false"></button>
      <div id="About"     class="tab-content" style="display:block"></div>
      <div id="BaseStats" class="tab-content" style="display:none"></div>
      <div id="Moves"     class="tab-content" style="display:none"></div>
      <div class="moves-container" id="moves-1" data-pokemon-id="1" data-loaded="false">Loading moves...</div>
    </div>
  `;
});

// ─── openTab ─────────────────────────────────────────────────────────────────

describe('openTab', () => {
  it('hides all other tab-content panels and reveals only the target', () => {
    const card = getCard();
    const btn = card.querySelector<HTMLElement>('[data-tab="BaseStats"]') as HTMLElement;
    openTab(card, btn, 'BaseStats');
    expect((document.getElementById('BaseStats') as HTMLElement).style.display).toBe('block');
    expect((document.getElementById('About') as HTMLElement).style.display).toBe('none');
    expect((document.getElementById('Moves') as HTMLElement).style.display).toBe('none');
  });

  it('marks the clicked button active and deselects all others', () => {
    const card = getCard();
    const btn = card.querySelector<HTMLElement>('[data-tab="BaseStats"]') as HTMLElement;
    openTab(card, btn, 'BaseStats');
    expect(btn.classList.contains('active')).toBe(true);
    expect(btn.getAttribute('aria-selected')).toBe('true');
    expect(
      (card.querySelector('[data-tab="About"]') as Element).getAttribute('aria-selected'),
    ).toBe('false');
  });

  it('adds moves-active class on the container when switching to Moves tab', () => {
    const card = getCard();
    const btn = card.querySelector<HTMLElement>('[data-tab="Moves"]') as HTMLElement;
    openTab(card, btn, 'Moves');
    expect(card.classList.contains('moves-active')).toBe(true);
  });

  it('removes moves-active class when switching away from Moves tab', () => {
    const card = getCard();
    card.classList.add('moves-active');
    const btn = card.querySelector<HTMLElement>('[data-tab="About"]') as HTMLElement;
    openTab(card, btn, 'About');
    expect(card.classList.contains('moves-active')).toBe(false);
  });
});

// ─── attachTabListeners ───────────────────────────────────────────────────────

describe('attachTabListeners', () => {
  it('wires click handlers so tab buttons switch to their target panel', () => {
    const card = getCard();
    attachTabListeners(card);
    (card.querySelector<HTMLElement>('[data-tab="BaseStats"]') as HTMLElement).click();
    expect((document.getElementById('BaseStats') as HTMLElement).style.display).toBe('block');
  });
});

// ─── navigateTabs ─────────────────────────────────────────────────────────────

describe('navigateTabs', () => {
  it('ArrowDown moves focus from the first tab to the second', () => {
    navigateTabs('ArrowDown');
    expect(
      (getCard().querySelector('[data-tab="BaseStats"]') as Element).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('ArrowDown wraps from the last tab back to the first', () => {
    const card = getCard();
    card.querySelectorAll('.tab-button').forEach((b) => {
      b.setAttribute('aria-selected', 'false');
    });
    (card.querySelector<HTMLElement>('[data-tab="Moves"]') as HTMLElement).setAttribute(
      'aria-selected',
      'true',
    );
    navigateTabs('ArrowDown');
    expect(
      (card.querySelector('[data-tab="About"]') as Element).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('ArrowUp wraps from the first tab to the last', () => {
    navigateTabs('ArrowUp');
    expect(
      (getCard().querySelector('[data-tab="Moves"]') as Element).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('returns early without error when .details-card is absent', () => {
    (document.querySelector('.details-card') as Element).remove();
    expect(() => {
      navigateTabs('ArrowDown');
    }).not.toThrow();
  });

  it('does nothing gracefully when no tab buttons are present', () => {
    getCard()
      .querySelectorAll('.tab-button')
      .forEach((b) => {
        b.remove();
      });
    expect(() => {
      navigateTabs('ArrowDown');
    }).not.toThrow();
  });
});

// ─── loadPokemonMoves ─────────────────────────────────────────────────────────

describe('loadPokemonMoves', () => {
  it('returns early without rendering when the moves element is absent from container', () => {
    loadPokemonMoves('999', getCard());
    expect(vi.mocked(setHTML)).not.toHaveBeenCalled();
  });

  it('renders the error template when the pokemon is not in state', () => {
    vi.mocked(getPokemonDetails).mockReturnValue([]);
    loadPokemonMoves('1', getCard());
    expect(vi.mocked(movesErrorTemplate)).toHaveBeenCalled();
    expect(vi.mocked(setHTML)).toHaveBeenCalled();
  });

  it('marks the container as loaded and renders move tags when pokemon exists', () => {
    loadPokemonMoves('1', getCard());
    expect((document.getElementById('moves-1') as HTMLElement).dataset.loaded).toBe('true');
    expect(vi.mocked(createMovesHTMLTemplate)).toHaveBeenCalledWith([{ name: 'tackle' }]);
  });

  it('slices moves to a maximum of 20', () => {
    const manyMoves = Array.from({ length: 30 }, (_, i) => ({ move: { name: `move-${i}` } }));
    vi.mocked(getPokemonDetails).mockReturnValue([{ ...POKEMON, moves: manyMoves }] as never);
    loadPokemonMoves('1', getCard());
    const [renderedMoves] = vi.mocked(createMovesHTMLTemplate).mock.calls[0] as Parameters<
      typeof createMovesHTMLTemplate
    >;
    expect(renderedMoves.length).toBe(20);
  });
});
