import { describe, it, expect } from 'vitest';
import {
  typeColor,
  getTypeIconSrc,
  capitalizeFirstLetter,
  formatStatName,
  filterPokemon,
  addHyphenation,
  formatMoveName,
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
    { name: 'bulbasaur', id: 1 },
    { name: 'ivysaur', id: 2 },
    { name: 'charmander', id: 4 },
    { name: 'charmeleon', id: 5 },
    { name: 'charizard', id: 6 },
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

  it('matches by exact Pokémon ID number', () => {
    const result = filterPokemon(list, '4', 10);
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('charmander');
  });

  it('does not partially match IDs', () => {
    expect(filterPokemon(list, '1', 10)).toEqual([{ name: 'bulbasaur', id: 1 }]);
  });
});

describe('formatStatName', () => {
  it('formats special-attack correctly', () => {
    expect(formatStatName('special-attack')).toBe('Sp. Attack');
  });

  it('formats special-defense correctly', () => {
    expect(formatStatName('special-defense')).toBe('Sp. Defense');
  });

  it('formats hp as uppercase', () => {
    expect(formatStatName('hp')).toBe('HP');
  });

  it('formats known stat names via lookup table', () => {
    expect(formatStatName('attack')).toBe('Attack');
    expect(formatStatName('speed')).toBe('Speed');
  });

  it('capitalizes unknown stat names as fallback', () => {
    expect(formatStatName('unknown-stat')).toBe('Unknown-stat');
  });
});

describe('formatMoveName', () => {
  it('capitalizes each word and replaces hyphens with spaces', () => {
    expect(formatMoveName('fire-blast')).toBe('Fire Blast');
  });

  it('handles single-word moves', () => {
    expect(formatMoveName('tackle')).toBe('Tackle');
  });

  it('handles three-part move names', () => {
    expect(formatMoveName('double-edge')).toBe('Double Edge');
  });

  it('returns empty string for empty input', () => {
    expect(formatMoveName('')).toBe('');
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

  it('processes words longer than 6 chars and returns a string', () => {
    const result = addHyphenation('charmander');
    expect(typeof result).toBe('string');
    expect(result.replace(/­/g, '')).toBe('charmander');
  });

  it('inserts soft-hyphen between double consonants in long words', () => {
    const result = addHyphenation('butterfly');
    expect(result.replace(/­/g, '')).toBe('butterfly');
    expect(result.length).toBeGreaterThan('butterfly'.length);
  });

  it('handles prefix patterns in long words without throwing', () => {
    expect(() => addHyphenation('underwater')).not.toThrow();
    expect(() => addHyphenation('overpower')).not.toThrow();
  });

  it('handles vowel+ing suffix in long words', () => {
    const result = addHyphenation('canoeing');
    expect(result.replace(/­/g, '')).toBe('canoeing');
  });

  it('handles vowel+ed suffix in long words', () => {
    const result = addHyphenation('carried');
    expect(result.replace(/­/g, '')).toBe('carried');
  });

  it('processes each word independently in multi-word strings', () => {
    const result = addHyphenation('charmander fire');
    const parts = result.split(' ');
    expect(parts).toHaveLength(2);
    expect(parts[1]).toBe('fire');
  });
});
