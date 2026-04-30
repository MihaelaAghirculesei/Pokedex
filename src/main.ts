import DOMPurify from 'dompurify';
import { typeColor, capitalizeFirstLetter, filterPokemon } from './utils.js';
import {
  createPokemonCardTemplate,
  detailTemplate,
  errorMessageTemplate,
  movesErrorTemplate,
  createMovesHTMLTemplate,
} from './templates.js';
import type { Pokemon, PokemonListResponse } from './types.js';
import { initLogoAnimation } from './logo.js';

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = 'https://pokeapi.co/api/v2/';
const LIMIT = 30;
const MIN_SEARCH_LENGTH = 3;
const SEARCH_DEBOUNCE_DELAY = 300;
const MAX_SEARCH_RESULTS = 20;
const LOGO_ANIMATION_DELAY_MS = 1000;

const SLIDE_DURATION_MS = (() => {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--transition-duration')
    .trim();
  return val ? parseFloat(val) * 1000 : 300;
})();

// ─── DOM refs ─────────────────────────────────────────────────────────────────

function getEl(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Required element #${id} is missing from the DOM`);
  return el;
}

const loadingIndicator = getEl('loading');
const loadMoreButton = getEl('load-more') as HTMLButtonElement;
const pokedexContainer = getEl('pokedex-container');
const searchResultsStatus = getEl('search-status');

// ─── State ───────────────────────────────────────────────────────────────────

const pokemonDetails: Pokemon[] = [];
let offset = 0;
let fetchAbortController: AbortController | null = null;
let searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
let previouslyFocusedElement: HTMLElement | null = null;
let currentOverlayPokemon: Pokemon | null = null;
let mousemoveRafPending = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setHTML(element: Element, html: string): void {
  element.innerHTML = DOMPurify.sanitize(html, {
    ADD_ATTR: ['data-tab', 'data-loaded', 'data-pokemon-id'],
  });
}

const showLoading = (): void => { loadingIndicator.removeAttribute('hidden'); };
const hideLoading = (): void => { loadingIndicator.setAttribute('hidden', 'true'); };

function announceSearchResults(count: number, searchTerm: string): void {
  searchResultsStatus.textContent =
    count > 0
      ? `${count} Pokémon found for "${searchTerm}"`
      : `No Pokémon found for "${searchTerm}". Try loading more.`;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  await fetchPokemonData();
  initSearch();
}

async function fetchPokemonData(): Promise<void> {
  fetchAbortController?.abort();
  fetchAbortController = new AbortController();
  const { signal } = fetchAbortController;

  const previousCount = pokemonDetails.length;
  try {
    if (previousCount === 0) {
      renderSkeletons();
    } else {
      showLoading();
    }
    loadMoreButton.disabled = true;

    const data = await fetchPokemons(signal);
    const newPokemon = await fetchAllPokemonDetails(data.results, signal);
    pokemonDetails.push(...newPokemon);
    offset += LIMIT;

    const activeSearch =
      (document.getElementById('search-input') as HTMLInputElement | null)
        ?.value.toLowerCase() ?? '';

    if (activeSearch.length >= MIN_SEARCH_LENGTH) {
      handleSearch(activeSearch);
    } else {
      renderPokemon(pokemonDetails);
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
      handleFetchError(error);
    }
  } finally {
    hideLoading();
    loadMoreButton.disabled = false;
    fetchAbortController = null;
  }
}

async function fetchPokemons(signal: AbortSignal): Promise<PokemonListResponse> {
  const response = await fetch(
    `${BASE_URL}pokemon?offset=${offset}&limit=${LIMIT}`,
    { signal }
  );
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json() as Promise<PokemonListResponse>;
}

async function fetchAllPokemonDetails(
  results: { url: string }[],
  signal: AbortSignal
): Promise<Pokemon[]> {
  return Promise.all(results.map(p => fetchOnePokemon(p.url, signal)));
}

async function fetchOnePokemon(url: string, signal: AbortSignal): Promise<Pokemon> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json() as Promise<Pokemon>;
}

function handleFetchError(error: Error): void {
  console.error('Pokémon fetch failed:', error);

  const isRateLimit = error.message.includes('429');
  const isServer = /5\d\d/.exec(error.message);
  const message = isRateLimit
    ? 'Too many requests. Please wait a moment and try again.'
    : isServer
    ? 'The Pokémon API is temporarily unavailable. Please try again later.'
    : 'Failed to load Pokémon data. Check your connection and try again.';

  displayError(message);
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
    renderPokemon(pokemonDetails);
    searchResultsStatus.textContent = '';
    return;
  }
  searchTimeoutId = setTimeout(() => { handleSearch(searchTerm); }, SEARCH_DEBOUNCE_DELAY);
}

function handleSearch(searchTerm: string): void {
  const filtered = filterPokemon(pokemonDetails, searchTerm, MAX_SEARCH_RESULTS);
  if (filtered.length > 0) {
    renderPokemon(filtered);
  } else {
    displayError(`No Pokémon found for "${searchTerm}". Try loading more Pokémon first.`);
  }
  announceSearchResults(filtered.length, searchTerm);
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderSkeletons(): void {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < LIMIT; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="pokemon-card-header">
        <div class="skeleton-block" style="width:55%;height:18px"></div>
        <div class="skeleton-block" style="width:20%;height:18px"></div>
      </div>
      <div class="pokemon-image-container">
        <div class="skeleton-block" style="width:180px;height:180px;border-radius:50%"></div>
      </div>
      <div class="pokemon-card-footer">
        <div class="skeleton-block" style="width:70px;height:28px;border-radius:12px"></div>
      </div>
    `;
    fragment.appendChild(card);
  }
  pokedexContainer.replaceChildren(fragment);
}

function renderPokemon(pokemonArray: Pokemon[]): void {
  const fragment = document.createDocumentFragment();
  pokemonArray.forEach((pokemon, index) => fragment.appendChild(createPokemonCard(pokemon, index === 0)));
  pokedexContainer.replaceChildren(fragment);
}

function createPokemonCard(pokemon: Pokemon, isFirst = false): HTMLElement {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.dataset.name = pokemon.name;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Show details for ${pokemon.name}`);
  card.style.backgroundColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
  setHTML(card, createPokemonCardTemplate(pokemon, isFirst));
  return card;
}

function displayError(message: string): void {
  setHTML(pokedexContainer, errorMessageTemplate(message));
}

// ─── Overlay ─────────────────────────────────────────────────────────────────

function createDetailsHTML(pokemon: Pokemon): string {
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities.map(a => a.ability.name).join(', ');
  return detailTemplate(pokemon, height, weight, abilities);
}

function showPokemonDetails(pokemon: Pokemon): void {
  if (document.querySelector('.overlay')) return;

  previouslyFocusedElement = document.activeElement as HTMLElement;
  currentOverlayPokemon = pokemon;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Pokémon details');
  overlay.setAttribute('tabindex', '-1');

  const detailsCard = document.createElement('div');
  detailsCard.className = 'details-card';
  detailsCard.style.backgroundColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
  setHTML(detailsCard, createDetailsHTML(pokemon));
  attachTabListeners(detailsCard);
  appendNavigationButtons(detailsCard, pokemon);

  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay(overlay);
  });

  requestAnimationFrame(() => { overlay.focus(); });
}

function closeOverlay(overlay: HTMLElement): void {
  overlay.remove();
  document.body.classList.remove('no-scroll');
  currentOverlayPokemon = null;
  previouslyFocusedElement?.focus();
}

function appendNavigationButtons(detailsCard: HTMLElement, pokemon: Pokemon): void {
  const imageSection = detailsCard.querySelector('.pokemon-image-section');
  if (!imageSection) return;

  const prevButton = createNavButton('prev', pokemon);
  const nextButton = createNavButton('next', pokemon);
  prevButton.classList.add('arrow-left');
  nextButton.classList.add('arrow-right');

  imageSection.appendChild(prevButton);
  imageSection.appendChild(nextButton);
}

function createNavButton(direction: 'prev' | 'next', currentPokemon: Pokemon): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = direction === 'prev' ? '<' : '>';
  button.className = `arrow-button ${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'Previous Pokémon' : 'Next Pokémon');
  button.addEventListener('click', e => {
    e.stopPropagation();
    if (direction === 'prev') showPreviousPokemon(currentPokemon);
    else showNextPokemon(currentPokemon);
  });
  return button;
}

function showPreviousPokemon(current: Pokemon): void {
  const idx = pokemonDetails.indexOf(current);
  updateDetailsCard(pokemonDetails[(idx - 1 + pokemonDetails.length) % pokemonDetails.length] as Pokemon, 'prev');
}

function showNextPokemon(current: Pokemon): void {
  const idx = pokemonDetails.indexOf(current);
  updateDetailsCard(pokemonDetails[(idx + 1) % pokemonDetails.length] as Pokemon, 'next');
}

function updateDetailsCard(pokemon: Pokemon, direction: 'prev' | 'next' = 'next'): void {
  currentOverlayPokemon = pokemon;

  const detailsCard = document.querySelector<HTMLElement>('.details-card');
  if (!detailsCard) return;

  const overlay = document.querySelector<HTMLElement>('.overlay');
  const slideOut = direction === 'next' ? '-100%' : '100%';
  const slideIn = direction === 'next' ? '100%' : '-100%';
  const dur = `${SLIDE_DURATION_MS / 1000}s`;

  detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
  detailsCard.style.transform = `translateX(${slideOut})`;
  detailsCard.style.opacity = '0';

  detailsCard.addEventListener('transitionend', function onSlideOut(e: TransitionEvent) {
    if (e.propertyName !== 'transform') return;
    detailsCard.removeEventListener('transitionend', onSlideOut);

    detailsCard.style.transition = 'none';
    detailsCard.style.transform = `translateX(${slideIn})`;
    detailsCard.style.backgroundColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
    setHTML(detailsCard, createDetailsHTML(pokemon));
    attachTabListeners(detailsCard);
    appendNavigationButtons(detailsCard, pokemon);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
        detailsCard.style.transform = 'translateX(0)';
        detailsCard.style.opacity = '1';
        overlay?.focus();
      });
    });
  });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function openTab(evt: Event, tabName: string): void {
  document.querySelectorAll<HTMLElement>('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  document.querySelectorAll('.tab-button').forEach(btn => { btn.classList.remove('active'); });

  const target = document.getElementById(tabName);
  if (target) target.style.display = 'block';
  (evt.currentTarget as HTMLElement).classList.add('active');

  const detailsCard = document.querySelector('.details-card');
  if (!detailsCard) return;

  if (tabName === 'Moves') {
    detailsCard.classList.add('moves-active');
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (movesContainer?.dataset.loaded === 'false') {
      const pokemonId = movesContainer.dataset.pokemonId ?? '';
      if (pokemonId) loadPokemonMoves(pokemonId);
    }
  } else {
    detailsCard.classList.remove('moves-active');
  }
}

function attachTabListeners(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.tab-button').forEach(btn => {
    btn.addEventListener('click', e => { openTab(e, btn.dataset.tab ?? ''); });
  });
}

function loadPokemonMoves(pokemonId: string): void {
  const movesContainer = document.getElementById(`moves-${pokemonId}`);
  if (!movesContainer) return;

  const pokemon = pokemonDetails.find(p => p.id === Number(pokemonId));
  if (!pokemon) {
    setHTML(movesContainer, movesErrorTemplate());
    return;
  }

  const moves = pokemon.moves.slice(0, 20).map(m => ({
    name: capitalizeFirstLetter(m.move.name.replace(/-/g, ' ')),
  }));

  movesContainer.dataset.loaded = 'true';
  setHTML(movesContainer, createMovesHTMLTemplate(moves));
}

// ─── Keyboard & focus trap ────────────────────────────────────────────────────

document.addEventListener('keydown', (e: KeyboardEvent) => {
  const overlay = document.querySelector<HTMLElement>('.overlay');

  if (overlay) {
    if (e.key === 'Escape') {
      closeOverlay(overlay);
      return;
    }
    if (e.key === 'Tab') {
      trapFocus(e, overlay);
      return;
    }
    if (!currentOverlayPokemon) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); showPreviousPokemon(currentOverlayPokemon); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showNextPokemon(currentOverlayPokemon); }
    return;
  }

  if ((document.activeElement as HTMLElement).tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    document.body.classList.add('keyboard-nav');
    navigateCards(e.key);
  }
});

function trapFocus(e: KeyboardEvent, overlay: HTMLElement): void {
  const focusable = overlay.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable.length === 0) { e.preventDefault(); return; }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (e.shiftKey) {
    if (document.activeElement === first || document.activeElement === overlay) {
      e.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function navigateCards(key: string): void {
  const cards = Array.from(pokedexContainer.querySelectorAll<HTMLElement>('.pokemon-card'));
  if (cards.length === 0) return;

  const currentIndex = cards.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) {
    const target = key === 'ArrowLeft' ? cards[cards.length - 1] : cards[0];
    target?.focus();
    target?.scrollIntoView({ block: 'center' });
    return;
  }

  if (key === 'ArrowRight') {
    if (currentIndex + 1 < cards.length) {
      cards[currentIndex + 1]?.focus();
      cards[currentIndex + 1]?.scrollIntoView({ block: 'center' });
    } else {
      loadMoreButton.focus();
      loadMoreButton.scrollIntoView({ block: 'center' });
    }
  } else {
    if (currentIndex - 1 >= 0) {
      cards[currentIndex - 1]?.focus();
      cards[currentIndex - 1]?.scrollIntoView({ block: 'center' });
    } else {
      loadMoreButton.focus();
      loadMoreButton.scrollIntoView({ block: 'center' });
    }
  }
}

// ─── Card interactions ────────────────────────────────────────────────────────

function openCardOverlay(e: Event): void {
  const card = (e.target as HTMLElement).closest<HTMLElement>('.pokemon-card');
  if (!card) return;
  const pokemon = pokemonDetails.find(p => p.name === card.dataset.name);
  if (pokemon) showPokemonDetails(pokemon);
}

pokedexContainer.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement).closest('.retry-btn')) {
    void init();
    return;
  }
  openCardOverlay(e);
});

pokedexContainer.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openCardOverlay(e);
  }
});

// throttled via requestAnimationFrame — fires at most once per frame
pokedexContainer.addEventListener('mousemove', (e: MouseEvent) => {
  if (mousemoveRafPending) return;
  mousemoveRafPending = true;
  requestAnimationFrame(() => {
    mousemoveRafPending = false;
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

document.addEventListener('mousemove', () => {
  document.body.classList.remove('keyboard-nav');
  const focused = document.activeElement as HTMLElement;
  if (focused.classList.contains('pokemon-card')) focused.blur();
});

loadMoreButton.addEventListener('click', () => { void fetchPokemonData(); });

// ─── Init ─────────────────────────────────────────────────────────────────────

void init();
setTimeout(initLogoAnimation, LOGO_ANIMATION_DELAY_MS);
