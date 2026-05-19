import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../state.js', () => ({
  getActiveScrollCleanup: vi.fn(() => null),
  setActiveScrollCleanup: vi.fn(),
}));

import {
  getActiveScrollable,
  updateScrollIndicator,
  setupScrollIndicator,
} from '../scroll-indicator.js';
import { getActiveScrollCleanup, setActiveScrollCleanup } from '../state.js';

function makeContainer(activeTab: string | null = 'About'): HTMLElement {
  const c = document.createElement('div');

  ['About', 'BaseStats', 'Moves'].forEach((tab) => {
    const btn = document.createElement('button');
    btn.className = 'tab-button' + (tab === activeTab ? ' active' : '');
    btn.dataset.tab = tab;
    c.appendChild(btn);
  });

  const aboutContent = document.createElement('div');
  aboutContent.id = 'About';
  aboutContent.className = 'tab-content';
  c.appendChild(aboutContent);

  const movesContent = document.createElement('div');
  movesContent.className = 'moves-container';
  c.appendChild(movesContent);

  const indicator = document.createElement('button');
  indicator.className = 'scroll-indicator';
  indicator.hidden = true;
  c.appendChild(indicator);

  return c;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getActiveScrollCleanup).mockReturnValue(null);
});

// ─── getActiveScrollable ──────────────────────────────────────────────────────

describe('getActiveScrollable', () => {
  it('returns null when no .tab-button.active exists', () => {
    const c = makeContainer(null);
    expect(getActiveScrollable(c)).toBeNull();
  });

  it('returns .moves-container when active tab is Moves', () => {
    const c = makeContainer('Moves');
    expect(getActiveScrollable(c)).toBe(c.querySelector('.moves-container'));
  });

  it('returns the matching #id.tab-content element for non-Moves tabs', () => {
    const c = makeContainer('About');
    expect(getActiveScrollable(c)).toBe(c.querySelector('#About'));
  });
});

// ─── updateScrollIndicator ────────────────────────────────────────────────────

describe('updateScrollIndicator', () => {
  it('calls the existing cleanup function and resets it to null', () => {
    const cleanup = vi.fn();
    vi.mocked(getActiveScrollCleanup).mockReturnValue(cleanup);
    updateScrollIndicator(makeContainer(null));
    expect(cleanup).toHaveBeenCalled();
    expect(vi.mocked(setActiveScrollCleanup)).toHaveBeenCalledWith(null);
  });

  it('hides the indicator when there is no scrollable element', () => {
    const c = makeContainer(null);
    updateScrollIndicator(c);
    expect((c.querySelector<HTMLElement>('.scroll-indicator') as HTMLElement).hidden).toBe(true);
  });

  it('hides the indicator when content does not overflow (jsdom default)', () => {
    const c = makeContainer('About');
    updateScrollIndicator(c);
    expect((c.querySelector<HTMLElement>('.scroll-indicator') as HTMLElement).hidden).toBe(true);
  });

  it('shows the indicator when content overflows and scroll is not at bottom', () => {
    const c = makeContainer('About');
    const about = c.querySelector<HTMLElement>('#About') as HTMLElement;
    Object.defineProperty(about, 'scrollHeight', { get: () => 300, configurable: true });
    updateScrollIndicator(c);
    expect((c.querySelector<HTMLElement>('.scroll-indicator') as HTMLElement).hidden).toBe(false);
  });

  it('attaches a scroll listener and registers a cleanup function', () => {
    const c = makeContainer('About');
    const about = c.querySelector<HTMLElement>('#About') as HTMLElement;
    Object.defineProperty(about, 'scrollHeight', { get: () => 300, configurable: true });
    const addSpy = vi.spyOn(about, 'addEventListener');
    updateScrollIndicator(c);
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(vi.mocked(setActiveScrollCleanup)).toHaveBeenCalledWith(expect.any(Function));
  });
});

// ─── setupScrollIndicator ────────────────────────────────────────────────────

describe('setupScrollIndicator', () => {
  it('returns early without inserting any button when .detail-overlay is absent', () => {
    const c = document.createElement('div');
    expect(() => {
      setupScrollIndicator(c);
    }).not.toThrow();
    expect(c.querySelector('.scroll-indicator')).toBeNull();
  });

  it('removes a pre-existing .scroll-indicator before adding the new one', () => {
    const c = document.createElement('div');
    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    const stale = document.createElement('button');
    stale.className = 'scroll-indicator';
    overlay.appendChild(stale);
    c.appendChild(overlay);
    setupScrollIndicator(c);
    expect(overlay.querySelectorAll('.scroll-indicator').length).toBe(1);
  });

  it('appends a hidden button with aria-label "Scroll down" into .detail-overlay', () => {
    const c = document.createElement('div');
    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    c.appendChild(overlay);
    setupScrollIndicator(c);
    const btn = overlay.querySelector<HTMLElement>('.scroll-indicator') as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.hidden).toBe(true);
    expect(btn.getAttribute('aria-label')).toBe('Scroll down');
    expect(btn.textContent).toBe('↓');
  });
});
