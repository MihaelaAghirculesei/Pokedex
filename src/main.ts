import '../shared.css';
import '../style.css';
import type { Pokemon } from './types.js';
import { filterPokemon } from './utils.js';
import { initLogoAnimation } from './logo.js';
import { initPwaUpdateToast } from './pwa-toast.js';
import { fetchPokemons, fetchAllPokemonDetails, getErrorMessage } from './api.js';
import { renderSkeletons, renderPokemon, createPokemonCard, displayError } from './render.js';
import { showPokemonDetails } from './overlay.js';
import { setupKeyboard } from './keyboard.js';
import { state } from './state.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT                = 30;
const MIN_SEARCH_LENGTH    = 3;
const SEARCH_DEBOUNCE_DELAY = 300;
const MAX_SEARCH_RESULTS   = 20;
const LOGO_ANIMATION_DELAY_MS = 1000;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} is missing from the DOM`);
  return el;
}

const loadingIndicator   = getEl('loading');
const loadMoreButton     = getEl('load-more') as HTMLButtonElement;
const pokedexContainer   = getEl('pokedex-container');
const searchResultsStatus = getEl('search-status');
const searchNoResults    = getEl('search-no-results');

// ─── Private state ────────────────────────────────────────────────────────────

let offset = 0;
let fetchAbortController: AbortController | null = null;
let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const showLoading = (): void => { loadingIndicator.removeAttribute('hidden'); };
const hideLoading = (): void => { loadingIndicator.setAttribute('hidden', 'true'); };

function announceSearchResults(count: number, searchTerm: string): void {
  searchResultsStatus.textContent = count > 0
    ? `${count} Pokémon found for "${searchTerm}"`
    : `No Pokémon found for "${searchTerm}". Try loading more.`;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await fetchPokemonData();
  initSearch();
}

async function fetchPokemonData(): Promise<void> {
  fetchAbortController?.abort();
  fetchAbortController = new AbortController();
  const { signal } = fetchAbortController;

  const previousCount = state.pokemonDetails.length;
  try {
    if (previousCount === 0) {
      renderSkeletons(pokedexContainer, LIMIT);
    } else {
      showLoading();
    }
    loadMoreButton.disabled = true;

    const data    = await fetchPokemons(offset, LIMIT, signal);
    const newPokemon = await fetchAllPokemonDetails(data.results, signal);
    state.pokemonDetails.push(...newPokemon);
    offset += LIMIT;

    const activeSearch =
      (document.getElementById('search-input') as HTMLInputElement | null)
        ?.value.toLowerCase() ?? '';

    if (activeSearch.length >= MIN_SEARCH_LENGTH) {
      handleSearch(activeSearch);
    } else {
      renderPokemon(pokedexContainer, searchNoResults, state.pokemonDetails, buildCard);
      if (previousCount > 0) {
        const cards = pokedexContainer.querySelectorAll<HTMLElement>('.pokemon-card');
        const newCard = cards[previousCount];
        if (newCard) {
          newCard.focus();
          newCard.scrollIntoView({ block: 'center' });
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Pokémon fetch failed:', error);
      displayError(pokedexContainer, getErrorMessage(error));
    }
  } finally {
    hideLoading();
    loadMoreButton.disabled = false;
    fetchAbortController = null;
  }
}

// ─── Card factory (closes over showPokemonDetails) ────────────────────────────

function buildCard(pokemon: Pokemon, isFirst: boolean): HTMLElement {
  return createPokemonCard(pokemon, isFirst, showPokemonDetails);
}

// ─── Search ───────────────────────────────────────────────────────────────────

function initSearch(): void {
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  searchInput.addEventListener('input', handleSearchInput);
}

function handleSearchInput(e: Event): void {
  const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
  if (searchTimeoutId !== null) clearTimeout(searchTimeoutId);
  if (searchTerm.length < MIN_SEARCH_LENGTH) {
    renderPokemon(pokedexContainer, searchNoResults, state.pokemonDetails, buildCard);
    searchResultsStatus.textContent = '';
    return;
  }
  searchTimeoutId = setTimeout(() => { handleSearch(searchTerm); }, SEARCH_DEBOUNCE_DELAY);
}

function handleSearch(searchTerm: string): void {
  const filtered = filterPokemon(state.pokemonDetails, searchTerm, MAX_SEARCH_RESULTS);
  if (filtered.length > 0) {
    renderPokemon(pokedexContainer, searchNoResults, filtered, buildCard);
  } else {
    pokedexContainer.replaceChildren();
    searchNoResults.textContent = `No Pokémon found for "${searchTerm}". Try loading more.`;
    searchNoResults.removeAttribute('hidden');
  }
  announceSearchResults(filtered.length, searchTerm);
}

// ─── Card interactions ────────────────────────────────────────────────────────

pokedexContainer.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.retry-btn')) {
    void init();
    return;
  }
  const card = (e.target as HTMLElement).closest<HTMLElement>('.pokemon-card');
  if (!card) return;
  const pokemon = state.pokemonDetails.find(p => p.name === card.dataset.name);
  if (pokemon) showPokemonDetails(pokemon);
});

pokedexContainer.addEventListener('mousemove', (e: MouseEvent) => {
  if (state.mousemoveRafPending) return;
  state.mousemoveRafPending = true;
  requestAnimationFrame(() => {
    state.mousemoveRafPending = false;
    const card = (e.target as HTMLElement).closest<HTMLElement>('.pokemon-card');
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    card.style.setProperty('--x', `${((e.clientX - left) / width) * 100}%`);
    card.style.setProperty('--y', `${((e.clientY - top) / height) * 100}%`);
  });
});

pokedexContainer.addEventListener('mouseout', (e: MouseEvent) => {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.pokemon-card');
  if (!card || card.contains(e.relatedTarget as Node)) return;
  card.style.setProperty('--x', '50%');
  card.style.setProperty('--y', '50%');
});

loadMoreButton.addEventListener('click', () => { void fetchPokemonData(); });

// ─── Init ─────────────────────────────────────────────────────────────────────

setupKeyboard();
void init();
setTimeout(initLogoAnimation, LOGO_ANIMATION_DELAY_MS);
initPwaUpdateToast();
