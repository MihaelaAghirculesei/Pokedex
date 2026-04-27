import { getLang, setLang, applyLangToggleUI, type Language } from './i18n.js';
import { initLogoAnimation } from './logo.js';

interface PageTranslations {
  title: string;
  headline: string;
  info: string;
  euDispute: string;
  euText1: string;
  euText2: string;
  euText3: string;
  imageCredits: string;
  imageText1: string;
  imageText2: string;
  imageText3: string;
  backButton: string;
  sourceText: string;
}

const translations: Record<Language, PageTranslations> = {
  de: {
    title: 'Legal Notice',
    headline: 'Legal Notice',
    info: 'Informationen über den Diensteanbieter.',
    euDispute: 'EU-Streitschlichtung',
    euText1:
      'Gemäß Verordnung über Online-Streitbeilegung in Verbraucherangelegenheiten (ODR-Verordnung) möchten wir Sie über die Online-Streitbeilegungsplattform (OS-Plattform) informieren.',
    euText2:
      'Verbraucher haben die Möglichkeit, Beschwerden an die Online Streitbeilegungsplattform der Europäischen Kommission zu richten. Die dafür notwendigen Kontaktdaten finden Sie oben in unserem Legal Notice.',
    euText3:
      'Wir möchten Sie jedoch darauf hinweisen, dass wir nicht bereit oder verpflichtet sind, an Streitschlichtungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
    imageCredits: 'Bildernachweis',
    imageText1: 'Die Bilder, Fotos und Grafiken auf dieser Webseite sind urheberrechtlich geschützt.',
    imageText2: 'Die Bilderrechte liegen bei:',
    imageText3: 'Alle Texte sind urheberrechtlich geschützt.',
    backButton: 'Zurück zum Pokédex',
    sourceText: 'Quelle: Erstellt mit dem Impressum Generator von AdSimple',
  },
  en: {
    title: 'Legal Notice',
    headline: 'Legal Notice',
    info: 'Information about the service provider.',
    euDispute: 'EU Dispute Resolution',
    euText1:
      'In accordance with the Regulation on Online Dispute Resolution in Consumer Affairs (ODR Regulation), we would like to inform you about the Online Dispute Resolution Platform (OS Platform).',
    euText2:
      "Consumers have the option of directing complaints to the European Commission's Online Dispute Resolution platform. The necessary contact details can be found above in our legal notice.",
    euText3:
      'However, we would like to point out that we are not prepared or obliged to participate in dispute resolution procedures before a consumer arbitration board.',
    imageCredits: 'Image Credits',
    imageText1: 'The images, photos and graphics on this website are protected by copyright.',
    imageText2: 'The image rights belong to:',
    imageText3: 'All texts are protected by copyright.',
    backButton: 'Back to Pokédex',
    sourceText: 'Source: Created with the Legal Notice Generator by AdSimple',
  },
};

function applyTranslations(lang: Language): void {
  const tr = translations[lang];
  document.title = tr.title;
  document.documentElement.lang = lang;

  const qs = (sel: string): Element | null => document.querySelector(sel);

  const setText = (sel: string, text: string): void => {
    const el = qs(sel);
    if (el) el.textContent = text;
  };

  setText('h1.adsimple-322947329', tr.headline);
  setText('h1.adsimple-322947329 + p.adsimple-322947329', tr.info);
  setText('#eu-streitschlichtung', tr.euDispute);

  const euParagraphs = document.querySelectorAll<HTMLElement>(
    '#eu-streitschlichtung + p.adsimple-322947329'
  );
  if (euParagraphs[0]) euParagraphs[0].textContent = `${tr.euText1} ${tr.euText2}`;
  if (euParagraphs[1]) euParagraphs[1].textContent = tr.euText3;

  setText('#bildernachweis', tr.imageCredits);
  setText('#bildernachweis + p.adsimple-322947329', tr.imageText1);

  const rightsStrong = qs('#bildernachweis + p.adsimple-322947329 + p strong');
  if (rightsStrong) rightsStrong.textContent = tr.imageText2;

  const copyrightP = qs(
    '#bildernachweis + p.adsimple-322947329 + p + p.adsimple-322947329'
  );
  if (copyrightP) copyrightP.textContent = tr.imageText3;

  const backButton = qs('.button');
  if (backButton) backButton.textContent = tr.backButton;

  const sourceP = qs('p[style*="margin-top:15px"]');
  if (sourceP) sourceP.textContent = tr.sourceText;
}

function toggleLanguage(): void {
  const newLang: Language = getLang() === 'de' ? 'en' : 'de';
  setLang(newLang);
  applyTranslations(newLang);
  const toggle = document.getElementById('languageToggle');
  if (toggle) applyLangToggleUI(newLang, toggle);
}

document.addEventListener('DOMContentLoaded', () => {
  initLogoAnimation();

  const lang = getLang();
  if (lang === 'de') {
    applyTranslations('de');
  }

  const toggle = document.getElementById('languageToggle');
  if (toggle) {
    applyLangToggleUI(lang, toggle);
    toggle.addEventListener('click', toggleLanguage);
  }
});
