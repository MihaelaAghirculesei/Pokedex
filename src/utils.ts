export const typeColor: Record<string, string> = {
  bug: '#26de81',
  dark: '#705848',
  dragon: '#ffeaa7',
  electric: '#fed330',
  fairy: '#FF0069',
  fighting: '#30336b',
  fire: '#f0932b',
  flying: '#81ecec',
  grass: '#00b894',
  ground: '#EFB549',
  ghost: '#a55eea',
  ice: '#74b9ff',
  normal: '#95afc0',
  poison: '#6c5ce7',
  psychic: '#a29bfe',
  rock: '#2d3436',
  steel: '#b8b8d0',
  water: '#0190FF',
};

const TYPE_ICONS: Record<string, string> = {
  water: 'imgs/icons/water.png',
  grass: 'imgs/icons/grass.png',
  fire: 'imgs/icons/fire.png',
  normal: 'imgs/icons/normal.png',
  bug: 'imgs/icons/bug.png',
  poison: 'imgs/icons/poison.png',
  electric: 'imgs/icons/electric.png',
  ground: 'imgs/icons/ground.png',
  flying: 'imgs/icons/flying.png',
  psychic: 'imgs/icons/psychic.png',
  fairy: 'imgs/icons/fairy.png',
  fighting: 'imgs/icons/fighting.png',
  rock: 'imgs/icons/rock.png',
  steel: 'imgs/icons/steel.png',
  ice: 'imgs/icons/ice.png',
  ghost: 'imgs/icons/ghost.png',
  dark: 'imgs/icons/dark.png',
  dragon: 'imgs/icons/dragon.png',
};

export const getTypeIconSrc = (type: string): string => TYPE_ICONS[type] ?? '';

export const capitalizeFirstLetter = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const STAT_NAMES: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Attack',
  'special-defense': 'Sp. Defense',
  speed: 'Speed',
};

export const formatStatName = (name: string): string =>
  STAT_NAMES[name] ?? capitalizeFirstLetter(name);

export function filterPokemon<T extends { name: string; id: number }>(
  pokemonList: T[],
  searchTerm: string,
  limit: number
): T[] {
  const term = searchTerm.toLowerCase().trim();
  return pokemonList
    .filter(p => p.name.toLowerCase().includes(term) || String(p.id) === term)
    .slice(0, limit);
}

export const formatMoveName = (name: string): string =>
  name.split('-').map(capitalizeFirstLetter).join(' ');

export function getTextColorForBackground(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number): number => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.179 ? '#000000' : '#ffffff';
}

export function addHyphenation(text: string): string {
  return text.split(' ').map(word => hyphenateWord(word)).join(' ');
}

function hyphenateWord(word: string): string {
  if (word.length <= 6) return word;
  let result = word;
  result = result.replace(/([bcdfghjklmnpqrstvwxyz])\1/gi, '$1­$1');
  result = result.replace(/([aeiou])([bcdfghjklmnpqrstvwxyz])([aeiou])/gi, '$1­$2$3');
  result = result.replace(/([aeiou])([bcdfghjklmnpqrstvwxyz]{2})([aeiou])/gi, '$1$2­$3');
  result = result.replace(/(un|re|pre|dis|mis|over|under|out)([bcdfghjklmnpqrstvwxyz])/gi, '$1­$2');
  result = result.replace(/([aeiou])ing$/gi, '$1­ing');
  result = result.replace(/([aeiou])ed$/gi, '$1­ed');
  return result;
}
