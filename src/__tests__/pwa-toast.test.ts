import { describe, it, expect, beforeEach } from 'vitest';
import { showUpdateToast } from '../pwa-toast.js';

describe('PWA update toast', () => {
  beforeEach(() => {
    document.getElementById('pwa-toast')?.remove();
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
});
