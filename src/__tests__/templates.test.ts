import { describe, it, expect } from 'vitest';
import {
  createPokemonCardTemplate,
  detailTemplate,
  errorMessageTemplate,
  movesErrorTemplate,
  createMovesHTMLTemplate,
} from '../templates.js';
import type { Pokemon } from '../types.js';

const mockPokemon: Pokemon = {
  id: 1,
  name: 'bulbasaur',
  height: 7,
  weight: 69,
  sprites: {
    front_default: 'default.png',
    other: { 'official-artwork': { front_default: 'artwork.png' } },
  },
  types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
  abilities: [{ ability: { name: 'overgrow' } }, { ability: { name: 'chlorophyll' } }],
  stats: [
    { base_stat: 45, stat: { name: 'hp' } },
    { base_stat: 49, stat: { name: 'attack' } },
  ],
  moves: [{ move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }],
  species: { name: 'bulbasaur' },
};

const pokemonNoArtwork: Pokemon = {
  ...mockPokemon,
  id: 2,
  name: 'missingno',
  sprites: {
    front_default: null,
    other: { 'official-artwork': { front_default: null } },
  },
};

describe('createPokemonCardTemplate', () => {
  it('includes the Pokémon name', () => {
    expect(createPokemonCardTemplate(mockPokemon)).toContain('bulbasaur');
  });

  it('includes the Pokémon id', () => {
    expect(createPokemonCardTemplate(mockPokemon)).toContain('1');
  });

  it('prefers official artwork over front_default', () => {
    const html = createPokemonCardTemplate(mockPokemon);
    expect(html).toContain('artwork.png');
    expect(html).not.toContain('default.png');
  });

  it('falls back to fallback image when both sprites are null', () => {
    expect(createPokemonCardTemplate(pokemonNoArtwork)).toContain('pokemon-ball.png');
  });

  it('renders one type button per type', () => {
    const html = createPokemonCardTemplate(mockPokemon);
    const matches = html.match(/type-button/g) ?? [];
    expect(matches).toHaveLength(2);
  });
});

describe('detailTemplate', () => {
  it('renders height and weight in the About tab', () => {
    const html = detailTemplate(mockPokemon, '0.7', '6.9', 'overgrow, chlorophyll');
    expect(html).toContain('0.7');
    expect(html).toContain('6.9');
  });

  it('includes abilities', () => {
    const html = detailTemplate(mockPokemon, '0.7', '6.9', 'overgrow, chlorophyll');
    expect(html).toContain('overgrow');
  });

  it('includes all three tab buttons', () => {
    const html = detailTemplate(mockPokemon, '0.7', '6.9', 'overgrow');
    expect(html).toContain('data-tab="About"');
    expect(html).toContain('data-tab="BaseStats"');
    expect(html).toContain('data-tab="Moves"');
  });

  it('includes stat names from the API', () => {
    const html = detailTemplate(mockPokemon, '0.7', '6.9', 'overgrow');
    expect(html).toContain('45');
    expect(html).toContain('49');
  });
});

describe('errorMessageTemplate', () => {
  it('includes the provided error message', () => {
    expect(errorMessageTemplate('Something went wrong')).toContain('Something went wrong');
  });

  it('includes a retry button with the correct class', () => {
    expect(errorMessageTemplate('error')).toContain('retry-btn');
  });

  it('does not include inline onclick handlers', () => {
    expect(errorMessageTemplate('error')).not.toContain('onclick');
  });
});

describe('movesErrorTemplate', () => {
  it('returns a non-empty string', () => {
    expect(movesErrorTemplate().length).toBeGreaterThan(0);
  });
});

describe('createMovesHTMLTemplate', () => {
  it('renders one tag per move', () => {
    const moves = [{ name: 'Tackle' }, { name: 'Growl' }, { name: 'Vine Whip' }];
    const html = createMovesHTMLTemplate(moves);
    const matches = html.match(/move-compact-tag/g) ?? [];
    expect(matches).toHaveLength(3);
  });

  it('includes move names in the output', () => {
    const html = createMovesHTMLTemplate([{ name: 'Tackle' }]);
    expect(html).toContain('Tackle');
  });
});
