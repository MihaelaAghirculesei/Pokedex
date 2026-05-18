import DOMPurify from 'dompurify';
import type { Pokemon } from './types.js';
import { typeColor, getTextColorForBackground, formatMoveName } from './utils.js';
import { createPokemonCardTemplate, errorMessageTemplate } from './templates.js';

export function setHTML(element: Element, html: string): void {
  element.innerHTML = DOMPurify.sanitize(html, {
    ADD_ATTR: ['data-tab', 'data-loaded', 'data-pokemon-id'],
  });
}

export function renderSkeletons(container: HTMLElement, limit: number): void {
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < limit; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton-card';
    card.innerHTML = `
      <div class="pokemon-card-header">
        <div class="skeleton-block sk-name"></div>
        <div class="skeleton-block sk-id"></div>
      </div>
      <div class="pokemon-image-container">
        <div class="skeleton-block sk-image"></div>
      </div>
      <div class="pokemon-card-footer">
        <div class="skeleton-block sk-badge"></div>
      </div>
    `;
    fragment.appendChild(card);
  }
  container.replaceChildren(fragment);
}

export function renderPokemon(
  container: HTMLElement,
  searchNoResults: HTMLElement,
  pokemonArray: Pokemon[],
  createCard: (pokemon: Pokemon, isFirst: boolean) => HTMLElement,
): void {
  searchNoResults.setAttribute('hidden', '');
  const fragment = document.createDocumentFragment();
  pokemonArray.forEach((pokemon, index) => fragment.appendChild(createCard(pokemon, index === 0)));
  container.replaceChildren(fragment);
}

export function createPokemonCard(
  pokemon: Pokemon,
  isFirst: boolean,
  onOpen: (pokemon: Pokemon) => void,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.dataset.name = pokemon.name;
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Show details for ${formatMoveName(pokemon.name)}`);
  const bgColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
  card.style.backgroundColor = bgColor;
  card.style.color = getTextColorForBackground(bgColor);
  setHTML(card, createPokemonCardTemplate(pokemon, isFirst));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(pokemon);
    }
  });
  return card;
}

export function displayError(container: HTMLElement, message: string): void {
  setHTML(container, errorMessageTemplate(message));
}
