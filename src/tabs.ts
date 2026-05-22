import { getPokemonDetails } from './state.js';
import { setHTML } from './render.js';
import { movesErrorTemplate, createMovesHTMLTemplate } from './templates.js';

export function openTab(container: HTMLElement, btn: HTMLElement, tabName: string): void {
  container.querySelectorAll<HTMLElement>('.tab-content').forEach((tab) => {
    tab.style.display = 'none';
  });
  container.querySelectorAll<HTMLElement>('.tab-button').forEach((b) => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  const target = tabName ? container.querySelector<HTMLElement>(`#${tabName}`) : null;
  if (target) target.style.display = 'block';
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  if (tabName === 'Moves') {
    container.classList.add('moves-active');
    const movesContainer = container.querySelector<HTMLElement>('.moves-container');
    if (movesContainer?.dataset.loaded === 'false') {
      const pokemonId = movesContainer.dataset.pokemonId ?? '';
      if (pokemonId) loadPokemonMoves(pokemonId, container);
    }
  } else {
    container.classList.remove('moves-active');
  }
}

export function attachTabListeners(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('.tab-button').forEach((btn) => {
    btn.addEventListener('click', () => {
      openTab(container, btn, btn.dataset.tab ?? '');
    });
  });
}

export function navigateTabs(key: string): void {
  const container = document.querySelector<HTMLElement>('.details-card');
  if (!container) return;
  const tabs = Array.from(container.querySelectorAll<HTMLElement>('.tab-button'));
  const activeIndex = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  const fromIndex = activeIndex !== -1 ? activeIndex : 0;
  const nextIndex =
    key === 'ArrowDown'
      ? (fromIndex + 1) % tabs.length
      : (fromIndex - 1 + tabs.length) % tabs.length;
  const nextTab = tabs[nextIndex];
  if (nextTab) {
    nextTab.focus();
    openTab(container, nextTab, nextTab.dataset.tab ?? '');
  }
}

export function loadPokemonMoves(pokemonId: string, container: HTMLElement): void {
  const movesContainer = container.querySelector<HTMLElement>(`#moves-${pokemonId}`);
  if (!movesContainer) return;

  const pokemon = getPokemonDetails().find((p) => p.id === Number(pokemonId));
  if (!pokemon) {
    setHTML(movesContainer, movesErrorTemplate());
    return;
  }

  const moves = pokemon.moves.slice(0, 20).map((m) => ({ name: m.move.name }));
  movesContainer.dataset.loaded = 'true';
  setHTML(movesContainer, createMovesHTMLTemplate(moves));
}
