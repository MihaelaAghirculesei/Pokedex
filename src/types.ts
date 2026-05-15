export interface PokemonSprites {
  front_default: string | null;
  other: {
    'official-artwork': {
      front_default: string | null;
    };
  };
}

export type PokemonTypeName =
  | 'bug' | 'dark' | 'dragon' | 'electric' | 'fairy' | 'fighting'
  | 'fire' | 'flying' | 'ghost' | 'grass' | 'ground' | 'ice'
  | 'normal' | 'poison' | 'psychic' | 'rock' | 'steel' | 'water';

export interface PokemonType {
  type: {
    name: PokemonTypeName;
  };
}

export interface PokemonAbility {
  ability: {
    name: string;
  };
}

export interface PokemonStat {
  base_stat: number;
  stat: {
    name: string;
  };
}

export interface PokemonMove {
  move: {
    name: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: PokemonSprites;
  types: [PokemonType, ...PokemonType[]];
  abilities: PokemonAbility[];
  stats: PokemonStat[];
  moves: PokemonMove[];
  species: {
    name: string;
  };
}

export interface PokemonListResponse {
  results: { name: string; url: string }[];
}
