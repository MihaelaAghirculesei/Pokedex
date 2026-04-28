import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../logo.js', () => ({ initLogoAnimation: vi.fn() }));

const IMPRESSUM_DOM = `
  <header class="header">
    <button id="languageToggle" class="language-toggle en">
      <span class="lang-label">DE</span>
      <div class="slider"></div>
      <span class="lang-label active">EN</span>
    </button>
  </header>
  <main>
    <h1 class="adsimple-322947329">Legal Notice</h1>
    <p class="adsimple-322947329">Information about the service provider.</p>
    <h2 id="eu-streitschlichtung" class="adsimple-322947329">EU Dispute Resolution</h2>
    <p class="adsimple-322947329">EU text.</p>
    <p class="adsimple-322947329">However, we would...</p>
    <h2 id="bildernachweis" class="adsimple-322947329">Image Credits</h2>
    <p class="adsimple-322947329">The images are protected.</p>
    <p><strong>The image rights belong to:</strong></p>
    <p class="adsimple-322947329">All texts are protected by copyright.</p>
    <p style="margin-top:15px">Source: Created with the Legal Notice Generator by AdSimple</p>
  </main>
  <footer class="footer">
    <a href="index.html" class="button">Back to Pokédex</a>
  </footer>
`;

async function loadModule(): Promise<void> {
  await import('../impressum.js');
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

describe('impressum.ts — language handling', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.body.innerHTML = IMPRESSUM_DOM;
  });

  it('shows English content by default', async () => {
    await loadModule();

    expect(document.querySelector('h1.adsimple-322947329')?.textContent).toBe('Legal Notice');
    expect(document.querySelector('.button')?.textContent).toBe('Back to Pokédex');
  });

  it('applies German translations when lang is "de"', async () => {
    localStorage.setItem('pokedex-lang', 'de');
    await loadModule();

    expect(document.getElementById('eu-streitschlichtung')?.textContent).toBe('EU-Streitschlichtung');
    expect(document.querySelector('.button')?.textContent).toBe('Zurück zum Pokédex');
  });

  it('clicking the toggle switches EN → DE', async () => {
    await loadModule();

    document.getElementById('languageToggle')?.click();

    expect(localStorage.getItem('pokedex-lang')).toBe('de');
    expect(document.querySelector('.button')?.textContent).toBe('Zurück zum Pokédex');
  });

  it('clicking the toggle twice returns to EN', async () => {
    await loadModule();
    const toggle = document.getElementById('languageToggle');

    toggle?.click(); // EN → DE
    toggle?.click(); // DE → EN

    expect(localStorage.getItem('pokedex-lang')).toBe('en');
    expect(document.querySelector('.button')?.textContent).toBe('Back to Pokédex');
  });

  it('toggle UI reflects language after switch', async () => {
    await loadModule();
    const toggle = document.getElementById('languageToggle');
    expect(toggle).not.toBeNull();
    if (!toggle) return;

    toggle.click(); // EN → DE

    expect(toggle.classList.contains('en')).toBe(false);
    const labels = toggle.querySelectorAll('.lang-label');
    expect(labels[0]?.classList.contains('active')).toBe(true);
    expect(labels[1]?.classList.contains('active')).toBe(false);
  });

  it('loads without error when languageToggle is absent from DOM', async () => {
    document.body.innerHTML = '<main><h1>Test</h1></main>';
    await loadModule();
    expect(document.querySelector('h1')?.textContent).toBe('Test');
  });

  it('applies DE translations gracefully when most elements are absent', async () => {
    document.body.innerHTML = `
      <h1 class="adsimple-322947329">Legal Notice</h1>
      <button id="languageToggle" class="language-toggle en">
        <span class="lang-label">DE</span>
        <div class="slider"></div>
        <span class="lang-label active">EN</span>
      </button>
    `;
    localStorage.setItem('pokedex-lang', 'de');
    await loadModule();
    expect(document.querySelector('h1.adsimple-322947329')).toBeTruthy();
  });

  it('toggleLanguage handles toggle removed from DOM before click', async () => {
    await loadModule();
    const toggle = document.getElementById('languageToggle');
    if (!toggle) throw new Error('languageToggle not found');
    // Detach toggle so getElementById returns null inside toggleLanguage
    toggle.remove();
    // Event listener is still bound to the element object → toggleLanguage runs
    toggle.click();
    // No error should be thrown
    expect(document.getElementById('languageToggle')).toBeNull();
  });
});
