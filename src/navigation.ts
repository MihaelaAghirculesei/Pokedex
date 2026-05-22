import type { Pokemon } from './types.js';
import { typeColor, getTextColorForBackground } from './utils.js';
import { detailTemplate } from './templates.js';
import { setHTML } from './render.js';
import { getPokemonDetails, setCurrentOverlayPokemon } from './state.js';
import { attachTabListeners } from './tabs.js';

export function createDetailsHTML(pokemon: Pokemon): string {
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities.map((a) => a.ability.name).join(', ');
  return detailTemplate(pokemon, height, weight, abilities);
}

export function appendNavigationButtons(
  detailsCard: HTMLElement,
  pokemon: Pokemon,
  overlay: HTMLElement,
): void {
  if (!detailsCard.querySelector('.pokemon-image-section')) return;
  overlay.querySelectorAll<HTMLButtonElement>('.arrow-left, .arrow-right').forEach((b) => {
    b.remove();
  });
  const prevButton = createNavButton('prev', pokemon, overlay);
  const nextButton = createNavButton('next', pokemon, overlay);
  prevButton.classList.add('arrow-left');
  nextButton.classList.add('arrow-right');
  overlay.appendChild(prevButton);
  overlay.appendChild(nextButton);
}

function createNavButton(
  direction: 'prev' | 'next',
  currentPokemon: Pokemon,
  overlay: HTMLElement,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = direction === 'prev' ? '<' : '>';
  button.className = `arrow-button ${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'Previous Pokémon' : 'Next Pokémon');
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    if (direction === 'prev') showPreviousPokemon(currentPokemon, overlay);
    else showNextPokemon(currentPokemon, overlay);
  });
  return button;
}

export function showPreviousPokemon(current: Pokemon, overlay: HTMLElement): void {
  const all = getPokemonDetails();
  const idx = all.indexOf(current);
  updateDetailsCard(all[(idx - 1 + all.length) % all.length] as Pokemon, 'prev', overlay);
}

export function showNextPokemon(current: Pokemon, overlay: HTMLElement): void {
  const all = getPokemonDetails();
  const idx = all.indexOf(current);
  updateDetailsCard(all[(idx + 1) % all.length] as Pokemon, 'next', overlay);
}

export function updateDetailsCard(
  pokemon: Pokemon,
  direction: 'prev' | 'next' = 'next',
  overlay: HTMLElement,
): void {
  setCurrentOverlayPokemon(pokemon);

  const detailsCard = overlay.querySelector<HTMLElement>('.details-card');
  if (!detailsCard) return;

  const slideDurationMs = getSlideDurationMs();
  const slideOut = direction === 'next' ? '-100%' : '100%';
  const slideIn = direction === 'next' ? '100%' : '-100%';
  const dur = `${slideDurationMs / 1000}s`;

  detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
  detailsCard.style.transform = `translateX(${slideOut})`;
  detailsCard.style.opacity = '0';

  detailsCard.addEventListener('transitionend', function onSlideOut(e: TransitionEvent) {
    if (e.propertyName !== 'transform') return;
    detailsCard.removeEventListener('transitionend', onSlideOut);

    detailsCard.style.transition = 'none';
    detailsCard.style.transform = `translateX(${slideIn})`;
    const newBgColor = typeColor[pokemon.types[0].type.name] ?? '#95afc0';
    detailsCard.style.backgroundColor = newBgColor;
    detailsCard.style.color = getTextColorForBackground(newBgColor);
    setHTML(detailsCard, createDetailsHTML(pokemon));
    attachTabListeners(detailsCard);
    appendNavigationButtons(detailsCard, pokemon, overlay);

    // Two nested rAFs: first forces the browser to commit the new translateX
    // position to layout, second starts the transition from that position to 0.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
        detailsCard.style.transform = 'translateX(0)';
        detailsCard.style.opacity = '1';
        overlay.focus();
      });
    });
  });
}

// Reads the CSS custom property at call time so tests can stub getComputedStyle before the first call.
function getSlideDurationMs(): number {
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue('--transition-duration')
    .trim();
  return val ? parseFloat(val) * 1000 : 300;
}
