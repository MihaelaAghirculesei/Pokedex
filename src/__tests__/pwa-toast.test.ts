import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showUpdateToast, initPwaUpdateToast } from '../pwa-toast.js';

describe('PWA update toast', () => {
  beforeEach(() => {
    document.getElementById('pwa-toast')?.remove();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the toast with reload and dismiss buttons', () => {
    showUpdateToast();
    const toast = document.getElementById('pwa-toast');
    expect(toast).toBeTruthy();
    expect(toast?.querySelector('.pwa-toast-reload')).toBeTruthy();
    expect(toast?.querySelector('.pwa-toast-close')).toBeTruthy();
  });

  it('does not render a second toast if one already exists', () => {
    showUpdateToast();
    showUpdateToast();
    expect(document.querySelectorAll('#pwa-toast')).toHaveLength(1);
  });

  it('dismiss button removes the toast from the DOM', () => {
    showUpdateToast();
    document.querySelector<HTMLButtonElement>('.pwa-toast-close')?.click();
    expect(document.getElementById('pwa-toast')).toBeNull();
  });

  it('toast has role="status" and aria-live for screen readers', () => {
    showUpdateToast();
    const toast = document.getElementById('pwa-toast');
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.getAttribute('aria-live')).toBe('polite');
  });

  it('reload button calls window.location.reload', () => {
    const reloadMock = vi.fn();
    vi.stubGlobal('location', { reload: reloadMock });
    showUpdateToast();
    document.querySelector<HTMLButtonElement>('.pwa-toast-reload')?.click();
    expect(reloadMock).toHaveBeenCalledOnce();
  });

  it('initPwaUpdateToast returns early when serviceWorker is not supported', () => {
    // jsdom does not implement serviceWorker — 'serviceWorker' in navigator is false
    initPwaUpdateToast();
    expect(document.getElementById('pwa-toast')).toBeNull();
  });

  it('initPwaUpdateToast registers controllerchange listener when serviceWorker is available', () => {
    const listeners = new Map<string, EventListener>();
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { addEventListener: (evt: string, fn: EventListener) => listeners.set(evt, fn) },
      configurable: true,
      writable: true,
    });

    initPwaUpdateToast();
    expect(listeners.get('controllerchange')).toBe(showUpdateToast);

    // Fire the registered listener to confirm it shows the toast
    (listeners.get('controllerchange') as EventListener)({} as Event);
    expect(document.getElementById('pwa-toast')).toBeTruthy();

    // Restore — delete so 'serviceWorker' in navigator is false again for other tests
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });
});
