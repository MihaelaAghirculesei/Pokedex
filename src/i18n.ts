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

interface MainTranslations {
  searchPlaceholder: string;
  loadMore: string;
  loading: string;
  searchFound: (count: number, term: string) => string;
  searchNotFound: (term: string) => string;
  errorNotFound: (term: string) => string;
  errorRateLimit: string;
  errorServer: string;
  errorNetwork: string;
}

const mainUi: Record<Language, MainTranslations> = {
  de: {
    searchPlaceholder: 'Suchen',
    loadMore: '⚡ Mehr Pokémon laden',
    loading: 'Laden...',
    searchFound: (count, term) => `${count} Pokémon gefunden für „${term}"`,
    searchNotFound: term => `Kein Pokémon für „${term}" gefunden. Lade mehr Pokémon.`,
    errorNotFound: term => `Kein Pokémon für „${term}" gefunden. Lade zuerst mehr Pokémon.`,
    errorRateLimit: 'Zu viele Anfragen. Bitte kurz warten und erneut versuchen.',
    errorServer: 'Die Pokémon-API ist vorübergehend nicht erreichbar. Bitte später versuchen.',
    errorNetwork: 'Pokémon-Daten konnten nicht geladen werden. Internetverbindung prüfen.',
  },
  en: {
    searchPlaceholder: 'Search',
    loadMore: '⚡ Load More Pokémon',
    loading: 'Loading...',
    searchFound: (count, term) => `${count} Pokémon found for "${term}"`,
    searchNotFound: term => `No Pokémon found for "${term}". Try loading more.`,
    errorNotFound: term => `No Pokémon found for "${term}". Try loading more Pokémon first.`,
    errorRateLimit: 'Too many requests. Please wait a moment and try again.',
    errorServer: 'The Pokémon API is temporarily unavailable. Please try again later.',
    errorNetwork: 'Failed to load Pokémon data. Check your connection and try again.',
  },
};

export function t(): MainTranslations {
  return mainUi[getLang()];
}
