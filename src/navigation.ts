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

const navCleanups = new WeakMap<HTMLElement, () => void>();

export function appendNavigationButtons(
  detailsCard: HTMLElement,
  pokemon: Pokemon,
  overlay: HTMLElement,
): void {
  if (!detailsCard.querySelector('.pokemon-image-section')) return;

  navCleanups.get(overlay)?.();
  overlay.querySelectorAll<HTMLButtonElement>('.arrow-left, .arrow-right').forEach((b) => {
    b.remove();
  });

  const prevButton = createNavButton('prev', pokemon, overlay);
  const nextButton = createNavButton('next', pokemon, overlay);
  prevButton.classList.add('arrow-left');
  nextButton.classList.add('arrow-right');
  overlay.appendChild(prevButton);
  overlay.appendChild(nextButton);

  positionNavButtons(detailsCard, overlay);

  const handleResize = () => {
    positionNavButtons(detailsCard, overlay);
  };
  window.addEventListener('resize', handleResize);

  const mo = new MutationObserver(() => {
    if (!overlay.isConnected) {
      if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize);
      mo.disconnect();
      navCleanups.delete(overlay);
    }
  });
  mo.observe(document.body, { childList: true });

  navCleanups.set(overlay, () => {
    window.removeEventListener('resize', handleResize);
    mo.disconnect();
  });
}

function positionNavButtons(detailsCard: HTMLElement, overlay: HTMLElement): void {
  requestAnimationFrame(() => {
    if (!detailsCard.isConnected) return;

    const imageSection = detailsCard.querySelector<HTMLElement>('.pokemon-image-section');
    const prevButton = overlay.querySelector<HTMLElement>('.arrow-left');
    const nextButton = overlay.querySelector<HTMLElement>('.arrow-right');
    if (!imageSection || !prevButton || !nextButton) return;

    // During slide-in animation the card has a translateX transform, so
    // getBoundingClientRect() returns the off-screen position. offsetLeft /
    // offsetTop / offsetWidth / offsetHeight are unaffected by CSS transforms
    // and give the card's final (natural-layout) position instead.
    const t = detailsCard.style.transform;
    const isAnimating = Boolean(t && t !== 'none' && t !== 'translateX(0)');

    let cardLeft: number;
    let cardRight: number;
    let imgTop: number;
    let imgHeight: number;

    if (isAnimating) {
      cardLeft = detailsCard.offsetLeft;
      cardRight = detailsCard.offsetLeft + detailsCard.offsetWidth;
      imgTop = detailsCard.offsetTop + imageSection.offsetTop;
      imgHeight = imageSection.offsetHeight;
    } else {
      const cardRect = detailsCard.getBoundingClientRect();
      const imgRect = imageSection.getBoundingClientRect();
      cardLeft = cardRect.left;
      cardRight = cardRect.right;
      imgTop = imgRect.top;
      imgHeight = imgRect.height;
    }

    const btnW = prevButton.offsetWidth || 40;
    const btnH = prevButton.offsetHeight || 40;

    const top = imgTop + imgHeight / 2 - btnH / 2;
    prevButton.style.top = `${top}px`;
    prevButton.style.left = `${cardLeft - btnW / 2 + 25}px`;
    nextButton.style.top = `${top}px`;
    nextButton.style.left = `${cardRight - btnW / 2 - 34}px`;
  });
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

  const hideNavButtons = (el: HTMLElement) => {
    el.querySelectorAll<HTMLElement>('.arrow-left, .arrow-right').forEach((b) => {
      b.style.opacity = '0';
      b.style.pointerEvents = 'none';
    });
  };
  const showNavButtons = (el: HTMLElement) => {
    el.querySelectorAll<HTMLElement>('.arrow-left, .arrow-right').forEach((b) => {
      b.style.opacity = '1';
      b.style.pointerEvents = '';
    });
  };

  hideNavButtons(overlay);

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
    hideNavButtons(overlay);

    // Two nested rAFs: first forces the browser to commit the new translateX
    // position to layout, second starts the transition from that position to 0.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsCard.style.transition = `transform ${dur} ease-out, opacity ${dur} ease-out`;
        detailsCard.style.transform = 'translateX(0)';
        detailsCard.style.opacity = '1';
        overlay.focus();
        detailsCard.addEventListener('transitionend', function onSlideIn(e: TransitionEvent) {
          if (e.propertyName !== 'transform') return;
          detailsCard.removeEventListener('transitionend', onSlideIn);
          positionNavButtons(detailsCard, overlay);
          showNavButtons(overlay);
        });
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
