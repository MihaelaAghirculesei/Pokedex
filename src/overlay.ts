import type { Pokemon } from './types.js';
import { typeColor, getTextColorForBackground, formatMoveName } from './utils.js';
import { detailTemplate, movesErrorTemplate, createMovesHTMLTemplate } from './templates.js';
import { setHTML } from './render.js';
import { state } from './state.js';

// ─── Scroll Indicator ─────────────────────────────────────────────────────────

export function getActiveScrollable(container: HTMLElement): HTMLElement | null {
  const btn = container.querySelector<HTMLElement>('.tab-button.active');
  const tab = btn?.dataset.tab;
  if (!tab) return null;
  return tab === 'Moves'
    ? container.querySelector<HTMLElement>('.moves-container')
    : container.querySelector<HTMLElement>(`#${tab}.tab-content`);
}

export function updateScrollIndicator(container: HTMLElement): void {
  const indicator = container.querySelector<HTMLElement>('.scroll-indicator');
  if (!indicator) return;

  state.activeScrollAbort?.abort();
  state.activeScrollAbort = new AbortController();

  const scrollable = getActiveScrollable(container);
  const refresh = (): void => {
    if (!scrollable) { indicator.hidden = true; return; }
    const overflows = scrollable.scrollHeight > scrollable.clientHeight + 2;
    const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 10;
    indicator.hidden = !overflows || atBottom;
  };
  refresh();
  scrollable?.addEventListener('scroll', refresh, { signal: state.activeScrollAbort.signal });
}

export function setupScrollIndicator(container: HTMLElement): void {
  const detailOverlay = container.querySelector<HTMLElement>('.detail-overlay');
  if (!detailOverlay) return;
  detailOverlay.querySelector('.scroll-indicator')?.remove();
  const indicator = document.createElement('button');
  indicator.className = 'scroll-indicator';
  indicator.setAttribute('aria-label', 'Scroll down');
  indicator.textContent = '↓';
  indicator.hidden = true;
  indicator.addEventListener('click', () => {
    const scrollable = getActiveScrollable(container);
    scrollable?.scrollBy({ top: 80, behavior: 'smooth' });
  });
  detailOverlay.appendChild(indicator);
  updateScrollIndicator(container);
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export function openTab(btn: HTMLElement, tabName: string): void {
  document.querySelectorAll<HTMLElement>('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  document.querySelectorAll<HTMLElement>('.tab-button').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const target = document.getElementById(tabName);
  if (target) target.style.display = 'block';
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  const detailsCard = document.querySelector<HTMLElement>('.details-card');
  if (!detailsCard) return;

  if (tabName === 'Moves') {
    detailsCard.classList.add('moves-active');
    const movesContainer = document.querySelector<HTMLElement>('.moves-container');
    if (movesContainer?.dataset.loaded === 'false') {
      const pokemonId = movesContainer.dataset.pokemonId ?? '';
      if (pokemonId) loadPokemonMoves(pokemonId);
    }
    setTimeout(() => { updateScrollIndicator(detailsCard); }, 50);
  } else {
    detailsCard.classList.remove('moves-active');
    updateScrollIndicator(detailsCard);
  }
}

export function attachTabListeners(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => { openTab(btn, btn.dataset.tab ?? ''); });
  });
}

export function navigateTabs(key: string): void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>('.tab-button'));
  const activeIndex = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const fromIndex = activeIndex !== -1 ? activeIndex : 0;
  const nextIndex = key === 'ArrowDown'
    ? (fromIndex + 1) % tabs.length
    : (fromIndex - 1 + tabs.length) % tabs.length;
  const nextTab = tabs[nextIndex];
  if (nextTab) {
    nextTab.focus();
    openTab(nextTab, nextTab.dataset.tab ?? '');
  }
}

export function loadPokemonMoves(pokemonId: string): void {
  const movesContainer = document.getElementById(`moves-${pokemonId}`);
  if (!movesContainer) return;

  const pokemon = state.pokemonDetails.find(p => p.id === Number(pokemonId));
  if (!pokemon) {
    setHTML(movesContainer, movesErrorTemplate());
    return;
  }

  const moves = pokemon.moves.slice(0, 20).map(m => ({ name: m.move.name }));
  movesContainer.dataset.loaded = 'true';
  setHTML(movesContainer, createMovesHTMLTemplate(moves));
  const dc = document.querySelector<HTMLElement>('.details-card');
  if (dc) updateScrollIndicator(dc);
}

// ─── Overlay lifecycle ────────────────────────────────────────────────────────

function createDetailsHTML(pokemon: Pokemon, slideDurationMs: number): string {
  void slideDurationMs; // consumed by overlay caller, not here
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities.map(a => a.ability.name).join(', ');
  return detailTemplate(pokemon, height, weight, abilities);
}

export function closeOverlay(overlay: HTMLElement): void {
  state.activeScrollAbort?.abort();
  state.activeScrollAbort = null;
  overlay.remove();
  document.body.classList.remove('no-scroll');
  document.title = 'Pokédex';
  state.currentOverlayPokemon = null;
  state.previouslyFocusedElement?.focus();
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

export function showPreviousPokemon(current: Pokemon): void {
  const idx = state.pokemonDetails.indexOf(current);
  updateDetailsCard(
    state.pokemonDetails[(idx - 1 + state.pokemonDetails.length) % state.pokemonDetails.length] as Pokemon,
    'prev',
  );
}

export function showNextPokemon(current: Pokemon): void {
  const idx = state.pokemonDetails.indexOf(current);
  updateDetailsCard(
    state.pokemonDetails[(idx + 1) % state.pokemonDetails.length] as Pokemon,
    'next',
  );
}

export function updateDetailsCard(pokemon: Pokemon, direction: 'prev' | 'next' = 'next'): void {
  state.currentOverlayPokemon = pokemon;

  const detailsCard = document.querySelector<HTMLElement>('.details-card');
  if (!detailsCard) return;

  const overlay = document.querySelector<HTMLElement>('.overlay');
  const slideDurationMs = getSlideDurationMs();
  const slideOut = direction === 'next' ? '-100%' : '100%';
  const slideIn  = direction === 'next' ? '100%'  : '-100%';
  const dur = `${slideDurationMs / 1000}s`;

  detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
  detailsCard.style.transform  = `translateX(${slideOut})`;
  detailsCard.style.opacity    = '0';

  detailsCard.addEventListener('transitionend', function onSlideOut(e: TransitionEvent) {
    if (e.propertyName !== 'transform') return;
    detailsCard.removeEventListener('transitionend', onSlideOut);

    detailsCard.style.transition = 'none';
    detailsCard.style.transform  = `translateX(${slideIn})`;
    const newBgColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
    detailsCard.style.backgroundColor = newBgColor;
    detailsCard.style.color = getTextColorForBackground(newBgColor);
    setHTML(detailsCard, createDetailsHTML(pokemon, slideDurationMs));
    attachTabListeners(detailsCard);
    appendNavigationButtons(detailsCard, pokemon);
    setupScrollIndicator(detailsCard);

    // Two nested rAFs: first forces the browser to commit the new translateX
    // position to layout, second starts the transition from that position to 0.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
        detailsCard.style.transform  = 'translateX(0)';
        detailsCard.style.opacity    = '1';
        overlay?.focus();
      });
    });
  });
}

export function showPokemonDetails(pokemon: Pokemon): void {
  if (document.querySelector('.overlay')) return;

  state.previouslyFocusedElement = document.activeElement as HTMLElement;
  state.currentOverlayPokemon    = pokemon;
  document.title = `${formatMoveName(pokemon.name)} — Pokédex`;

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `${formatMoveName(pokemon.name)} details`);
  overlay.setAttribute('tabindex', '-1');

  const detailsCard = document.createElement('div');
  detailsCard.className = 'details-card';
  const detailsBgColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
  detailsCard.style.backgroundColor = detailsBgColor;
  detailsCard.style.color = getTextColorForBackground(detailsBgColor);
  setHTML(detailsCard, createDetailsHTML(pokemon, getSlideDurationMs()));
  attachTabListeners(detailsCard);
  appendNavigationButtons(detailsCard, pokemon);

  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeOverlay(overlay);
  });

  requestAnimationFrame(() => {
    overlay.focus();
    setupScrollIndicator(detailsCard);
  });
}

// Reads the CSS custom property at call time (same as original SLIDE_DURATION_MS IIFE,
// but deferred so tests can stub getComputedStyle before the first call).
function getSlideDurationMs(): number {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--transition-duration')
    .trim();
  return val ? parseFloat(val) * 1000 : 300;
}
