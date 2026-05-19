import { getActiveScrollCleanup, setActiveScrollCleanup } from './state.js';

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

  getActiveScrollCleanup()?.();
  setActiveScrollCleanup(null);

  const scrollable = getActiveScrollable(container);
  const refresh = (): void => {
    if (!scrollable) {
      indicator.hidden = true;
      return;
    }
    const overflows = scrollable.scrollHeight > scrollable.clientHeight + 2;
    const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 10;
    indicator.hidden = !overflows || atBottom;
  };
  refresh();
  if (scrollable) {
    scrollable.addEventListener('scroll', refresh);
    setActiveScrollCleanup(() => {
      scrollable.removeEventListener('scroll', refresh);
    });
  }
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
