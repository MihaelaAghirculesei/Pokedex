import '../shared.css';
import '../style.css';
import type { Pokemon } from './types.js';
import { filterPokemon } from './utils.js';
import { fetchPokemons, fetchAllPokemonDetails, getErrorMessage } from './api.js';
import { renderSkeletons, renderPokemon, createPokemonCard, displayError } from './render.js';
import {
  getPokemonDetails,
  appendPokemonDetails,
  isMousemoveRafPending,
  setMousemoveRafPending,
} from './state.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 30;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_DELAY = 300;
const MAX_SEARCH_RESULTS = 20;
const LOGO_ANIMATION_DELAY_MS = 1000;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} is missing from the DOM`);
  return el;
}

const loadingIndicator = getEl('loading');
const loadMoreButton = getEl('load-more') as HTMLButtonElement;
const pokedexContainer = getEl('pokedex-container');
const searchInput = getEl('search-input') as HTMLInputElement;
const searchResultsStatus = getEl('search-status');
const searchNoResults = getEl('search-no-results');

// ─── Private state ────────────────────────────────────────────────────────────

let offset = 0;
let fetchAbortController: AbortController | null = null;
let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const showLoading = (): void => {
  loadingIndicator.removeAttribute('hidden');
};
const hideLoading = (): void => {
  loadingIndicator.setAttribute('hidden', 'true');
};
const revealLoadMore = (): void => {
  loadMoreButton.classList.add('is-visible');
};

function announceSearchResults(count: number, searchTerm: string): void {
  searchResultsStatus.textContent =
    count > 0
      ? `${count} Pokémon found for "${searchTerm}"`
      : `No Pokémon found for "${searchTerm}". Try loading more.`;
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchPokemonData(): Promise<void> {
  fetchAbortController?.abort();
  fetchAbortController = new AbortController();
  const { signal } = fetchAbortController;

  const previousCount = getPokemonDetails().length;
  try {
    if (previousCount === 0) {
      // Skip if inline skeletons from index.html are already rendered
      if (pokedexContainer.children.length === 0) renderSkeletons(pokedexContainer, LIMIT);
    } else {
      showLoading();
    }
    loadMoreButton.disabled = true;

    const data = await fetchPokemons(offset, LIMIT, signal);
    const newPokemon = await fetchAllPokemonDetails(data.results, signal);
    appendPokemonDetails(newPokemon);
    offset += LIMIT;

    const activeSearch = searchInput.value.toLowerCase();

    if (activeSearch.length >= MIN_SEARCH_LENGTH) {
      handleSearch(activeSearch);
    } else {
      renderPokemon(pokedexContainer, searchNoResults, getPokemonDetails(), buildCard);
      if (previousCount > 0) {
        const cards = pokedexContainer.querySelectorAll<HTMLElement>('.pokemon-card');
        const newCard = cards[previousCount];
        if (newCard) {
          newCard.focus();
          newCard.scrollIntoView({ block: 'center' });
        }
      }
    }
    revealLoadMore();
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      displayError(pokedexContainer, getErrorMessage(error));
    }
  } finally {
    hideLoading();
    loadMoreButton.disabled = false;
    fetchAbortController = null;
  }
}

// ─── Interaction modules (pre-warmed, never on the critical render path) ──────

// Both start downloading when main.js evaluates. By the time a user can
// interact (cards are rendered + JS is idle), the modules are already cached
// and _overlayMod is populated — so the click path is synchronous.
interface OverlayMod {
  showPokemonDetails: (p: Pokemon) => void;
}
let _overlayMod: OverlayMod | null = null;
const _overlayModPromise = import('./overlay.js').then((mod) => {
  _overlayMod = mod;
  return mod;
});
void import('./keyboard.js').then(({ setupKeyboard }) => {
  setupKeyboard();
});

function openOverlay(pokemon: Pokemon): void {
  if (_overlayMod) {
    _overlayMod.showPokemonDetails(pokemon);
  } else {
    void _overlayModPromise.then((mod) => {
      mod.showPokemonDetails(pokemon);
    });
  }
}

// ─── Card factory ─────────────────────────────────────────────────────────────

function buildCard(pokemon: Pokemon, isFirst: boolean): HTMLElement {
  return createPokemonCard(pokemon, isFirst, openOverlay);
}

// ─── Search ───────────────────────────────────────────────────────────────────

function initSearch(): void {
  searchInput.addEventListener('input', handleSearchInput);
}

function handleSearchInput(e: Event): void {
  const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
  if (searchTimeoutId !== null) clearTimeout(searchTimeoutId);
  if (searchTerm.length < MIN_SEARCH_LENGTH) {
    renderPokemon(pokedexContainer, searchNoResults, getPokemonDetails(), buildCard);
    searchResultsStatus.textContent = '';
    return;
  }
  searchTimeoutId = setTimeout(() => {
    handleSearch(searchTerm);
  }, SEARCH_DEBOUNCE_DELAY);
}

function handleSearch(searchTerm: string): void {
  const filtered = filterPokemon(getPokemonDetails(), searchTerm, MAX_SEARCH_RESULTS);
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
    void fetchPokemonData();
    return;
  }
  const card = (e.target as HTMLElement).closest<HTMLElement>('.pokemon-card');
  if (!card) return;
  const pokemon = getPokemonDetails().find((p) => p.name === card.dataset.name);
  if (pokemon) openOverlay(pokemon);
});

pokedexContainer.addEventListener('mousemove', (e: MouseEvent) => {
  if (isMousemoveRafPending()) return;
  setMousemoveRafPending(true);
  requestAnimationFrame(() => {
    setMousemoveRafPending(false);
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

loadMoreButton.addEventListener('click', () => {
  void fetchPokemonData();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

initSearch();
void fetchPokemonData();

// Defer non-critical modules to keep the critical path lean
setTimeout(() => {
  void import('./logo.js')
    .then(({ initLogoAnimation }) => {
      initLogoAnimation();
    })
    .catch(() => {
      // logo animation is non-critical; ignore load failures (e.g. test teardown)
    });
}, LOGO_ANIMATION_DELAY_MS);
setTimeout(() => {
  void import('./pwa-toast.js').then(({ initPwaUpdateToast }) => {
    initPwaUpdateToast();
  });
}, 0);
setTimeout(() => {
  void import('./monitoring.js')
    .then(({ initMonitoring }) => {
      initMonitoring();
    })
    .catch(() => {
      // monitoring is non-critical; ignore load failures (e.g. test teardown)
    });
}, 2000);
