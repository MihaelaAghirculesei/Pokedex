import type { Pokemon, PokemonListResponse } from './types.js';

const BASE_URL = 'https://pokeapi.co/api/v2/';

export async function fetchPokemons(
  offset: number,
  limit: number,
  signal: AbortSignal,
): Promise<PokemonListResponse> {
  const response = await fetch(`${BASE_URL}pokemon?offset=${offset}&limit=${limit}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json() as Promise<PokemonListResponse>;
}

export async function fetchAllPokemonDetails(
  results: { url: string }[],
  signal: AbortSignal,
): Promise<Pokemon[]> {
  const settled = await Promise.allSettled(results.map(p => fetchOnePokemon(p.url, signal)));
  const fulfilled = settled
    .filter((r): r is PromiseFulfilledResult<Pokemon> => r.status === 'fulfilled')
    .map(r => r.value);
  if (fulfilled.length === 0 && results.length > 0) {
    throw (settled[0] as PromiseRejectedResult).reason as Error;
  }
  return fulfilled;
}

export async function fetchOnePokemon(url: string, signal: AbortSignal): Promise<Pokemon> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json() as Promise<Pokemon>;
}

export function getErrorMessage(error: Error): string {
  if (error.message.includes('429')) return 'Too many requests. Please wait a moment and try again.';
  if (/5\d\d/.exec(error.message)) return 'The Pokémon API is temporarily unavailable. Please try again later.';
  return 'Failed to load Pokémon data. Check your connection and try again.';
}
