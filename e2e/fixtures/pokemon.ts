export const BULBASAUR = {
  id: 1,
  name: 'bulbasaur',
  types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
  sprites: {
    front_default: '',
    other: { 'official-artwork': { front_default: '' } },
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
  species: { name: 'ivysaur' },
};
