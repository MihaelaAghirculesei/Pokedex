export const BULBASAUR = {
  id: 1,
  name: 'bulbasaur',
  types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    other: {
      'official-artwork': {
        front_default:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
      },
    },
  },
  height: 7,
  weight: 69,
  abilities: [{ ability: { name: 'overgrow' } }],
  stats: [
    { stat: { name: 'hp' }, base_stat: 45 },
    { stat: { name: 'attack' }, base_stat: 49 },
    { stat: { name: 'defense' }, base_stat: 49 },
    { stat: { name: 'special-attack' }, base_stat: 65 },
    { stat: { name: 'special-defense' }, base_stat: 65 },
    { stat: { name: 'speed' }, base_stat: 45 },
  ],
  moves: [{ move: { name: 'tackle' } }, { move: { name: 'vine-whip' } }],
  species: { name: 'bulbasaur' },
};

export const IVYSAUR = {
  ...BULBASAUR,
  id: 2,
  name: 'ivysaur',
  sprites: {
    front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png',
    other: {
      'official-artwork': {
        front_default:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png',
      },
    },
  },
  species: { name: 'ivysaur' },
};
