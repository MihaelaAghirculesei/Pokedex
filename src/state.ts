import type { Pokemon } from './types.js';

interface AppState {
  pokemonDetails: Pokemon[];
  currentOverlayPokemon: Pokemon | null;
  previouslyFocusedElement: HTMLElement | null;
  activeScrollCleanup: (() => void) | null;
  mousemoveRafPending: boolean;
}

const _state: AppState = {
  pokemonDetails: [],
  currentOverlayPokemon: null,
  previouslyFocusedElement: null,
  activeScrollCleanup: null,
  mousemoveRafPending: false,
};

export function getPokemonDetails(): readonly Pokemon[] {
  return _state.pokemonDetails;
}

export function appendPokemonDetails(pokemon: Pokemon[]): void {
  _state.pokemonDetails.push(...pokemon);
}

export function getCurrentOverlayPokemon(): Pokemon | null {
  return _state.currentOverlayPokemon;
}

export function setCurrentOverlayPokemon(pokemon: Pokemon | null): void {
  _state.currentOverlayPokemon = pokemon;
}

export function getPreviouslyFocusedElement(): HTMLElement | null {
  return _state.previouslyFocusedElement;
}

export function setPreviouslyFocusedElement(el: HTMLElement | null): void {
  _state.previouslyFocusedElement = el;
}

export function getActiveScrollCleanup(): (() => void) | null {
  return _state.activeScrollCleanup;
}

export function setActiveScrollCleanup(fn: (() => void) | null): void {
  _state.activeScrollCleanup = fn;
}

export function isMousemoveRafPending(): boolean {
  return _state.mousemoveRafPending;
}

export function setMousemoveRafPending(pending: boolean): void {
  _state.mousemoveRafPending = pending;
}
