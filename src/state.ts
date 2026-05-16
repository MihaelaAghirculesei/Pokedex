import type { Pokemon } from './types.js';

export const state = {
  pokemonDetails: [] as Pokemon[],
  currentOverlayPokemon: null as Pokemon | null,
  previouslyFocusedElement: null as HTMLElement | null,
  activeScrollCleanup: null as (() => void) | null,
  mousemoveRafPending: false,
};
