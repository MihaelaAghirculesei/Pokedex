import { state } from './state.js';
import { closeOverlay, showPreviousPokemon, showNextPokemon, navigateTabs } from './overlay.js';

function trapFocus(e: KeyboardEvent, overlay: HTMLElement): void {
  const focusable = overlay.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) {
    e.preventDefault();
    return;
  }

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
  const container = document.getElementById('pokedex-container');
  const loadMore = document.getElementById('load-more') as HTMLButtonElement | null;
  if (!container) return;

  const cards = Array.from(container.querySelectorAll<HTMLElement>('.pokemon-card'));
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
      loadMore?.focus();
      loadMore?.scrollIntoView({ block: 'center' });
    }
  } else {
    if (currentIndex - 1 >= 0) {
      cards[currentIndex - 1]?.focus();
      cards[currentIndex - 1]?.scrollIntoView({ block: 'center' });
    } else {
      loadMore?.focus();
      loadMore?.scrollIntoView({ block: 'center' });
    }
  }
}

function onKeydown(e: KeyboardEvent): void {
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
    if (!state.currentOverlayPokemon) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showPreviousPokemon(state.currentOverlayPokemon);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showNextPokemon(state.currentOverlayPokemon);
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      navigateTabs(e.key);
    }
    return;
  }

  if ((document.activeElement as HTMLElement).tagName === 'INPUT') return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    document.body.classList.add('keyboard-nav');
    navigateCards(e.key);
  }
}

function onMousemove(): void {
  document.body.classList.remove('keyboard-nav');
}

// Prevent listener accumulation when the module is re-imported in tests.
type DocRegistry = Document & { _pkKeydown?: typeof onKeydown; _pkMousemove?: typeof onMousemove };

export function setupKeyboard(): void {
  const d = document as DocRegistry;
  if (d._pkKeydown) document.removeEventListener('keydown', d._pkKeydown);
  if (d._pkMousemove) document.removeEventListener('mousemove', d._pkMousemove);
  d._pkKeydown = onKeydown;
  d._pkMousemove = onMousemove;
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('mousemove', onMousemove);
}
