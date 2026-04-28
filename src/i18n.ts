export type Language = 'de' | 'en';

const STORAGE_KEY = 'pokedex-lang';

export function getLang(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'de' ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

export function setLang(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // SecurityError in private browsing — ignore
  }
}

export function applyLangToggleUI(lang: Language, toggle: HTMLElement): void {
  const labels = toggle.querySelectorAll<HTMLElement>('.lang-label');
  if (lang === 'en') {
    toggle.classList.add('en');
    labels[0]?.classList.remove('active');
    labels[1]?.classList.add('active');
  } else {
    toggle.classList.remove('en');
    labels[0]?.classList.add('active');
    labels[1]?.classList.remove('active');
  }
}
