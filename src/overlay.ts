import type { Pokemon } from './types.js';
import { typeColor, getTextColorForBackground, formatMoveName } from './utils.js';
import { setHTML } from './render.js';
import {
  setCurrentOverlayPokemon,
  getPreviouslyFocusedElement,
  setPreviouslyFocusedElement,
} from './state.js';
import { attachTabListeners } from './tabs.js';
import { createDetailsHTML, appendNavigationButtons } from './navigation.js';

export function closeOverlay(overlay: HTMLElement): void {
  overlay.remove();
  document.body.classList.remove('no-scroll');
  document.title = 'Pokédex';
  setCurrentOverlayPokemon(null);
  getPreviouslyFocusedElement()?.focus();
}

export function showPokemonDetails(pokemon: Pokemon): void {
  if (document.querySelector('.overlay')) return;

  setPreviouslyFocusedElement(document.activeElement as HTMLElement);
  setCurrentOverlayPokemon(pokemon);
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
  setHTML(detailsCard, createDetailsHTML(pokemon));
  attachTabListeners(detailsCard);
  overlay.appendChild(detailsCard);
  appendNavigationButtons(detailsCard, pokemon, overlay);
  document.body.appendChild(overlay);
  document.body.classList.add('no-scroll');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay(overlay);
  });

  requestAnimationFrame(() => {
    overlay.focus();
  });
}
