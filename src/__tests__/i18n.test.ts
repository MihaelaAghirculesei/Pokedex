import { describe, it, expect, beforeEach } from 'vitest';
import { getLang, setLang, applyLangToggleUI } from '../i18n.js';

beforeEach(() => { localStorage.clear(); });

describe('getLang', () => {
  it('returns "en" by default when nothing is stored', () => {
    expect(getLang()).toBe('en');
  });

  it('returns "de" when "de" is stored', () => {
    localStorage.setItem('pokedex-lang', 'de');
    expect(getLang()).toBe('de');
  });

  it('returns "en" for any unknown stored value', () => {
    localStorage.setItem('pokedex-lang', 'fr');
    expect(getLang()).toBe('en');
  });
});

describe('setLang', () => {
  it('persists the language to localStorage', () => {
    setLang('de');
    expect(localStorage.getItem('pokedex-lang')).toBe('de');
  });

  it('overwrites a previously stored language', () => {
    setLang('de');
    setLang('en');
    expect(localStorage.getItem('pokedex-lang')).toBe('en');
  });

  it('getLang reflects the value written by setLang', () => {
    setLang('de');
    expect(getLang()).toBe('de');
    setLang('en');
    expect(getLang()).toBe('en');
  });
});

describe('applyLangToggleUI', () => {
  function makeToggle(): HTMLElement {
    const toggle = document.createElement('button');
    toggle.className = 'language-toggle en';
    const de = document.createElement('span');
    de.className = 'lang-label';
    const slider = document.createElement('div');
    slider.className = 'slider';
    const en = document.createElement('span');
    en.className = 'lang-label active';
    toggle.append(de, slider, en);
    return toggle;
  }

  it('keeps "en" class and activates EN label when lang is "en"', () => {
    const toggle = makeToggle();
    applyLangToggleUI('en', toggle);
    expect(toggle.classList.contains('en')).toBe(true);
    const labels = toggle.querySelectorAll('.lang-label');
    expect(labels[0]?.classList.contains('active')).toBe(false);
    expect(labels[1]?.classList.contains('active')).toBe(true);
  });

  it('removes "en" class and activates DE label when lang is "de"', () => {
    const toggle = makeToggle();
    applyLangToggleUI('de', toggle);
    expect(toggle.classList.contains('en')).toBe(false);
    const labels = toggle.querySelectorAll('.lang-label');
    expect(labels[0]?.classList.contains('active')).toBe(true);
    expect(labels[1]?.classList.contains('active')).toBe(false);
  });

  it('is idempotent — calling twice gives the same result', () => {
    const toggle = makeToggle();
    applyLangToggleUI('de', toggle);
    applyLangToggleUI('de', toggle);
    expect(toggle.classList.contains('en')).toBe(false);
  });
});

