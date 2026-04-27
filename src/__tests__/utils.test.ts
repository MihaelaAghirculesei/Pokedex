import { describe, it, expect } from 'vitest';
import {
  typeColor,
  getTypeIconSrc,
  capitalizeFirstLetter,
  filterPokemon,
  addHyphenation,
} from '../utils.js';

const ALL_TYPES = [
  'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting',
  'fire', 'flying', 'grass', 'ground', 'ghost', 'ice',
  'normal', 'poison', 'psychic', 'rock', 'steel', 'water',
];

describe('typeColor', () => {
  it('has an entry for all 18 types', () => {
    const missingTypes = ALL_TYPES.filter(type => !typeColor[type]);
    expect(missingTypes).toHaveLength(0);
  });

  it('stores valid hex color strings', () => {
    Object.values(typeColor).forEach(color => {
      expect(color).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    });
  });
});

describe('getTypeIconSrc', () => {
  it('returns the correct path for a known type', () => {
    expect(getTypeIconSrc('fire')).toBe('imgs/icons/fire.png');
  });

  it('returns an empty string for an unknown type', () => {
    expect(getTypeIconSrc('unknown')).toBe('');
  });

  it('handles all 18 types without throwing', () => {
    ALL_TYPES.forEach(type => {
      expect(() => getTypeIconSrc(type)).not.toThrow();
      expect(getTypeIconSrc(type)).not.toBe('');
    });
  });
});

describe('capitalizeFirstLetter', () => {
  it('capitalizes the first letter of a lowercase string', () => {
    expect(capitalizeFirstLetter('bulbasaur')).toBe('Bulbasaur');
  });

  it('leaves an already-capitalized string unchanged', () => {
    expect(capitalizeFirstLetter('Pikachu')).toBe('Pikachu');
  });

  it('returns an empty string for empty input', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });

  it('works on single-character strings', () => {
    expect(capitalizeFirstLetter('a')).toBe('A');
  });
});

describe('filterPokemon', () => {
  const list = [
    { name: 'bulbasaur' },
    { name: 'ivysaur' },
    { name: 'charmander' },
    { name: 'charmeleon' },
    { name: 'charizard' },
  ];

  it('filters by partial name', () => {
    const result = filterPokemon(list, 'char', 10);
    expect(result).toHaveLength(3);
    expect(result.map(p => p.name)).toEqual(['charmander', 'charmeleon', 'charizard']);
  });

  it('respects the limit', () => {
    expect(filterPokemon(list, 'char', 2)).toHaveLength(2);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterPokemon(list, 'mewtwo', 10)).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    expect(filterPokemon(list, 'CHAR', 10)).toHaveLength(3);
  });
});

describe('addHyphenation', () => {
  it('does not alter short words (≤ 6 chars)', () => {
    expect(addHyphenation('fire')).toBe('fire');
    expect(addHyphenation('water')).toBe('water');
  });

  it('handles multi-word strings without throwing', () => {
    expect(() => addHyphenation('solar beam')).not.toThrow();
  });

  it('preserves spaces between words', () => {
    const result = addHyphenation('water gun');
    expect(result.split(' ')).toHaveLength(2);
  });

  it('returns the original short word unchanged', () => {
    expect(addHyphenation('tackle')).toBe('tackle');
  });
});
