import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initLogoAnimation } from '../logo';

interface MockIOInstance {
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

describe('initLogoAnimation', () => {
  let observeMock: ReturnType<typeof vi.fn>;
  let unobserveMock: ReturnType<typeof vi.fn>;
  let capturedCallback: IntersectionObserverCallback;

  beforeEach(() => {
    observeMock = vi.fn();
    unobserveMock = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (this: MockIOInstance, cb: IntersectionObserverCallback) {
        capturedCallback = cb;
        this.observe = observeMock;
        this.unobserve = unobserveMock;
        this.disconnect = vi.fn();
      }),
    );
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('adds animate-logo to header logo when present', () => {
    document.body.innerHTML = `
      <header class="header"><span class="headline-icon"></span></header>
      <footer class="footer"><span class="headline-icon"></span></footer>
    `;
    initLogoAnimation();
    expect(
      document.querySelector('.header .headline-icon')?.classList.contains('animate-logo'),
    ).toBe(true);
  });

  it('does not throw when header logo is absent', () => {
    document.body.innerHTML = `<footer class="footer"><span class="headline-icon"></span></footer>`;
    expect(() => {
      initLogoAnimation();
    }).not.toThrow();
  });

  it('returns early and skips observer when footer logo is absent', () => {
    document.body.innerHTML = `<header class="header"><span class="headline-icon"></span></header>`;
    initLogoAnimation();
    expect(IntersectionObserver).not.toHaveBeenCalled();
  });

  it('creates IntersectionObserver and observes footer logo', () => {
    document.body.innerHTML = `
      <header class="header"><span class="headline-icon"></span></header>
      <footer class="footer"><span class="headline-icon"></span></footer>
    `;
    initLogoAnimation();
    const footerLogo = document.querySelector<HTMLElement>('.footer .headline-icon');
    expect(IntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalledWith(footerLogo);
  });

  it('re-triggers animate-logo animation when entry is intersecting', () => {
    document.body.innerHTML = `
      <header class="header"><span class="headline-icon"></span></header>
      <footer class="footer"><span class="headline-icon"></span></footer>
    `;
    initLogoAnimation();
    const footerLogo = document.querySelector<HTMLElement>('.footer .headline-icon');
    if (!footerLogo) throw new Error('footer logo not found');
    footerLogo.classList.add('animate-logo');

    capturedCallback(
      [{ isIntersecting: true, target: footerLogo } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(footerLogo.classList.contains('animate-logo')).toBe(true);
    expect(unobserveMock).toHaveBeenCalledWith(footerLogo);
  });

  it('does nothing when entry is not intersecting', () => {
    document.body.innerHTML = `
      <header class="header"><span class="headline-icon"></span></header>
      <footer class="footer"><span class="headline-icon"></span></footer>
    `;
    initLogoAnimation();
    const footerLogo = document.querySelector<HTMLElement>('.footer .headline-icon');
    if (!footerLogo) throw new Error('footer logo not found');

    capturedCallback(
      [{ isIntersecting: false, target: footerLogo } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(unobserveMock).not.toHaveBeenCalled();
  });
});
