# Changelog

All notable changes to this project are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0](https://github.com/MihaelaAghirculesei/Pokedex/releases/tag/v1.0.0) (2026-05-16)

### Features

- **404:** redesign 404 page with self-contained CSS, animations and footer ([0583446](https://github.com/MihaelaAghirculesei/Pokedex/commit/058344685df88027be64a2807e310243850042b7))
- **a11y:** add keyboard shortcuts hint widget to header ([e5b973d](https://github.com/MihaelaAghirculesei/Pokedex/commit/e5b973dd7409aa5562b9158b787da05d4e805843))
- add 32 Vitest unit tests for templates and utility functions ([6162cc5](https://github.com/MihaelaAghirculesei/Pokedex/commit/6162cc50d7fd488cdcb84c01e34a04fb29c3a30e))
- add custom 404 page and reorganize static assets into public ([70a96bf](https://github.com/MihaelaAghirculesei/Pokedex/commit/70a96bfc24d059bf1fa0ac38080d9e08ceedb7d3))
- add i18n and logo TypeScript modules ([ec0890d](https://github.com/MihaelaAghirculesei/Pokedex/commit/ec0890d9de5a9e48091b49cda5f91cd41d2fcc70))
- Add keyboard accessibility and card navigation ([3aeef19](https://github.com/MihaelaAghirculesei/Pokedex/commit/3aeef19aa4b40c9020ee75bc8c6e85cfe13ee45d))
- add PWA icons (192px, 512px) and OG social preview image ([31f51ea](https://github.com/MihaelaAghirculesei/Pokedex/commit/31f51eaa2481566faa646f7eebabaacdd0f582a9))
- add PWA icons 192x192 and 512x512 ([6b43ea7](https://github.com/MihaelaAghirculesei/Pokedex/commit/6b43ea78f97119c04c019d522ca6d4897c26127f))
- add TypeScript interfaces for all PokéAPI response shapes ([47619a6](https://github.com/MihaelaAghirculesei/Pokedex/commit/47619a699bae56ab509c595d4ba0343a4f432622))
- **api:** add fetchWithRetry with exponential back-off on 429/5xx ([6454939](https://github.com/MihaelaAghirculesei/Pokedex/commit/645493942017dcf5acdaf28fc910ef83828c9ee3))
- **assets:** add 20 WebP type icon files ([d87c9ca](https://github.com/MihaelaAghirculesei/Pokedex/commit/d87c9ca0f927bbfa4f861fb4da1e01869a07b947))
- **assets:** add Designer.webp background image ([61dda4a](https://github.com/MihaelaAghirculesei/Pokedex/commit/61dda4a036aef49fc80180fa98289979aeffaca1))
- final UI refinements and skeleton loader improvements ([b3ec047](https://github.com/MihaelaAghirculesei/Pokedex/commit/b3ec047f7e06f806a23ef1dcb09a865143d594c2))
- format names with Title Case, set document.title on overlay, fix mousemove focus ([4676ebd](https://github.com/MihaelaAghirculesei/Pokedex/commit/4676ebd60c41f9f5ce9f7d775fc7966b6a933e4a))
- Improve overlay navigation and accessibility (ESC key, arrow navigation, slide animations, ARIA attributes) ([84ef0fd](https://github.com/MihaelaAghirculesei/Pokedex/commit/84ef0fd4fe4df1709fb87ed2591f40d02f5e1498))
- **main:** init monitoring on startup; toggle load-more via .is-visible ([6039e8d](https://github.com/MihaelaAghirculesei/Pokedex/commit/6039e8dc9dfa218c8244beb3273ace0fca86d888))
- migrate HTML template functions to TypeScript ([2a037f0](https://github.com/MihaelaAghirculesei/Pokedex/commit/2a037f03878965ef919df368c3232772a3410a8d))
- migrate utility functions and type color map to TypeScript ([5856a19](https://github.com/MihaelaAghirculesei/Pokedex/commit/5856a19413fcb91720fb83b3a171b7b0bc0f1ca6))
- **monitoring:** add Sentry SDK, opt-in via VITE_SENTRY_DSN env var ([cdce175](https://github.com/MihaelaAghirculesei/Pokedex/commit/cdce17531e66d6a4e8a17d42e7232df551042da9))
- **overlay:** add keyboard shortcuts hint in detail card footer ([1cc975f](https://github.com/MihaelaAghirculesei/Pokedex/commit/1cc975f273913d14ee41a9af29f26d00a8138c49))
- **pwa:** add update toast on service worker controller change ([da15a98](https://github.com/MihaelaAghirculesei/Pokedex/commit/da15a98b916c42622ef38d89f5372cf928ef9296))
- remove i18n language toggle and hardcode EN strings ([44361e5](https://github.com/MihaelaAghirculesei/Pokedex/commit/44361e5b67c262f5abc28ded6a4b2bed2c2fed1d))
- rewrite main app and Impressum page in TypeScript with DE/EN i18n ([d52812e](https://github.com/MihaelaAghirculesei/Pokedex/commit/d52812ec18b2ab594ccd32e89d1729bd5e1ece5c))
- **scripts:** add convert-webp script and npm optimize hook ([fe4ad9b](https://github.com/MihaelaAghirculesei/Pokedex/commit/fe4ad9bed046a904cf45c8e1d1f8854b5a61a925))
- show inline no-results message instead of error overlay ([6f8f8da](https://github.com/MihaelaAghirculesei/Pokedex/commit/6f8f8dae3d344a3aedc56b2ab087fbaa02e703a4))
- skeleton loader on initial Pokédex load ([75bb66a](https://github.com/MihaelaAghirculesei/Pokedex/commit/75bb66a5aa77e32a9ba2c1b7ed40368f0d750380))
- **templates:** optimize images via wsrv.nl with responsive srcset ([962d72a](https://github.com/MihaelaAghirculesei/Pokedex/commit/962d72a4b42b8c258a890710443eb1c65507a3e2))
- **theme:** add light-mode overrides and keyboard shortcut hint styles ([0fd8a29](https://github.com/MihaelaAghirculesei/Pokedex/commit/0fd8a29c6595821a19f165cd82ebcd45905e6606))
- **types:** add PokemonTypeName exhaustive union ([b6b70ae](https://github.com/MihaelaAghirculesei/Pokedex/commit/b6b70ae89ac8d4588623a8e8c84314102fb63483))
- **ui:** apply dynamic text color to cards and fix type icon dimensions ([c718baa](https://github.com/MihaelaAghirculesei/Pokedex/commit/c718baaddc1d5f69b27e6e431ef9557ec2f201fb))
- update HTML entry points and CSS for Vite pipeline ([175e2a1](https://github.com/MihaelaAghirculesei/Pokedex/commit/175e2a1e72eb2f3cbffcf3277ee84665fa9cdcd6))
- **utils:** add getTextColorForBackground ([524cd43](https://github.com/MihaelaAghirculesei/Pokedex/commit/524cd4307857bc115eb639b4e6a9d09b7222756f))
- **utils:** migrate TYPE_ICONS to absolute WebP paths ([98fe986](https://github.com/MihaelaAghirculesei/Pokedex/commit/98fe986e262f5da9803afb013a98b402d05fe7fd))
- **ux:** add animated scroll indicator to detail overlay with AbortController cleanup ([28540bb](https://github.com/MihaelaAghirculesei/Pokedex/commit/28540bb2f93e98e1bc87f0639d954e4a7d647f92))

### Bug Fixes

- **a11y:** add keyboard nav on cards and ArrowUp/Down tab switching ([e44cc97](https://github.com/MihaelaAghirculesei/Pokedex/commit/e44cc9756fcb4eb7ef60f9f9600df18b5d7d4218))
- apply Title Case to Pokémon names and add aria-label to stat bars ([ab27f3a](https://github.com/MihaelaAghirculesei/Pokedex/commit/ab27f3ac22f75b961991db73f3e871263d6ef871))
- **deploy:** remove unsupported build section from wrangler.toml ([c5d9836](https://github.com/MihaelaAghirculesei/Pokedex/commit/c5d98369397ca3baad0d749a5477a9789dc48a3f))
- format move names as Title Case and remove DOMContentLoaded wrapper ([b9a1cfa](https://github.com/MihaelaAghirculesei/Pokedex/commit/b9a1cfa7fac6ef590a8beba63f9811c4442831f4))
- **impressum:** remove redundant euParagraphs setText cal ([eace330](https://github.com/MihaelaAghirculesei/Pokedex/commit/eace330fe3964a8bb7e478993568312cb7e11c4e))
- **impressum:** select source paragraph by id, not by style attribute ([55c0b01](https://github.com/MihaelaAghirculesei/Pokedex/commit/55c0b0180f24bd7f112a15ec35482bd04cbb5837))
- **main:** move initSearch to top-level, add revealLoadMore helper ([7af10bc](https://github.com/MihaelaAghirculesei/Pokedex/commit/7af10bcb11b729e65742748935e3857e2a067714))
- **nav:** replace else-if with else in navigateCards ([6076533](https://github.com/MihaelaAghirculesei/Pokedex/commit/60765330dc9e786d36e33f635408a2b5f72e1773))
- **overlay:** use double rAF for scroll indicator; remove unused param ([acb4d72](https://github.com/MihaelaAghirculesei/Pokedex/commit/acb4d7213584d88db48842f841466dc6756141ce))
- point og:image meta to dedicated og-image.png ([6441829](https://github.com/MihaelaAghirculesei/Pokedex/commit/6441829879c50a7479b04e01b83980f0f56c23f0))
- **pwa:** switch SW injection to script-defer ([50b064f](https://github.com/MihaelaAghirculesei/Pokedex/commit/50b064f28ee09e5147f5265128a9399cec2dd740))
- **pwa:** update screenshot format from png to jpeg in manifest ([aa01ecc](https://github.com/MihaelaAghirculesei/Pokedex/commit/aa01ecc90d291c2a0c9e1161f0739f43e3b02360))
- remove broken screenshot paths from PWA manifest ([bbe344e](https://github.com/MihaelaAghirculesei/Pokedex/commit/bbe344e28e696daa41ed1509a839bcb3ade49a19))
- restored main card glitter effect and removed overlay glitter for improved User Experience ([8d40bd9](https://github.com/MihaelaAghirculesei/Pokedex/commit/8d40bd9334484d1c09dd196cf8759496b54df24e))
- unify glitter scroll effect across all devices and clean up media queries ([3ca3aa9](https://github.com/MihaelaAghirculesei/Pokedex/commit/3ca3aa95b6bf9ffb92ef0dc45b84ab34ad9e51da))
- **ux:** hint minimum 3-char length in search placeholder ([d532e8b](https://github.com/MihaelaAghirculesei/Pokedex/commit/d532e8b30a1dd05f1d5a33a411f88008c9b7b2f2))

### Performance Improvements

- add canonical, preload hero image, fix img dimensions and hrefs ([15de613](https://github.com/MihaelaAghirculesei/Pokedex/commit/15de613eee5fb7c0e73bd40adfbb6c939a2b7c0d))
- **build:** add non-blocking CSS loader and vendor chunk split ([294e871](https://github.com/MihaelaAghirculesei/Pokedex/commit/294e871f91398cfd1bd6f941cbe2d1e26d435e6e))
- **css:** add content-visibility and fix details image sizing ([0b7c329](https://github.com/MihaelaAghirculesei/Pokedex/commit/0b7c3299e8cc54f73ba5544e26efd47a447d3a18))
- fix LCP — fetchpriority=high on first card, crossorigin on ([e3fe327](https://github.com/MihaelaAghirculesei/Pokedex/commit/e3fe32776b7a3e9407a9eaf798175684dce89bf1))
- **html:** inline critical CSS and add wsrv.nl preconnect hints ([39f587f](https://github.com/MihaelaAghirculesei/Pokedex/commit/39f587f084c4165f00d618fd706e7e919a4f345d))
- reduce initial load to 20, fix fetchpriority bypassing DOMPurify ([49aa21a](https://github.com/MihaelaAghirculesei/Pokedex/commit/49aa21ac0f5e9566f09c4aaf3a1da98f17e00bcd))
- replace background JPEG with optimized WebP (-41%) ([e8aa351](https://github.com/MihaelaAghirculesei/Pokedex/commit/e8aa35118e3b8d5f4c4332bb4c92d5c8e3ef6272))
- resize type icons to display size, 70px (-71%) ([88f06f8](https://github.com/MihaelaAghirculesei/Pokedex/commit/88f06f8a9db57d3eb179bb2549d82b0aba853366))

### Security

- **csp:** remove unsafe-inline from script-src and style-src ([618cd0b](https://github.com/MihaelaAghirculesei/Pokedex/commit/618cd0b7c4a1d8c0df4f1cdb83bdaf3e1f7edda1))
- **build:** CSP hash plugin, monitoring chunk, coverage thresholds at 80% ([2f9b6c6](https://github.com/MihaelaAghirculesei/Pokedex/commit/2f9b6c6d4a5df02c6a58cb5ab3b0f2c6f74e4e6c))

### Reverts

- undo LIMIT=20 and fetchpriority querySelector ([c01e55b](https://github.com/MihaelaAghirculesei/Pokedex/commit/c01e55b5b0d47961f431c2d47a8058dc1d09061d))
