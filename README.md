# Pokédex PWA

<div align="center">

![Pokédex](public/imgs/readme/pokedex.png)

[![Live Demo](https://img.shields.io/badge/Live_Demo-pokedex--aghirculesei.pages.dev-FF6B6B?style=for-the-badge&logo=rocket&logoColor=white)](https://pokedex-aghirculesei.pages.dev/)
[![PWA](https://img.shields.io/badge/PWA-Installable-4ECDC4?style=for-the-badge&logo=pwa&logoColor=white)](https://pokedex-aghirculesei.pages.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI](https://img.shields.io/github/actions/workflow/status/MihaelaAghirculesei/Pokedex/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI)](https://github.com/MihaelaAghirculesei/Pokedex/actions)
[![codecov](https://img.shields.io/codecov/c/github/MihaelaAghirculesei/Pokedex?style=for-the-badge&logo=codecov&logoColor=white&label=Coverage)](https://codecov.io/gh/MihaelaAghirculesei/Pokedex)

</div>

An offline-first Pokédex — originally built in pure Vanilla JavaScript to master browser APIs from scratch, then migrated to TypeScript and Vite to bring it to production quality.

---

## From Vanilla JS to TypeScript — and why it matters

This project went through a deliberate two-phase journey.

### Phase 1 — Vanilla JavaScript

The first version had zero dependencies, zero build step, and zero framework overhead. Every feature was written against raw browser APIs. This was intentional: understanding the platform before abstracting it.

```
Original stack
├── Pure Vanilla JavaScript (ES6+)     — zero framework overhead
├── Hand-crafted Service Worker        — three-tier cache (static, API, sprites)
├── Custom build-production.js script  — manual minification pipeline
└── Zero external dependencies         — maximum control, maximum learning
```

### Phase 2 — TypeScript + Vite

Once the features were solid and the architecture was proven, the codebase was migrated to TypeScript. The goal was not to rewrite — it was to enforce correctness at scale. Every original feature survived untouched. What changed was the tooling layer around it.

```
Migrated stack
├── TypeScript 6    — strict mode, noUncheckedIndexedAccess, exactOptionalPropertyTypes
├── Vite 7          — HMR in development, optimized bundles in production
├── Vitest 4        — 53 unit tests covering templates, utilities, and i18n
├── Workbox PWA     — declarative offline caching via vite-plugin-pwa
├── ESLint          — TypeScript strict rules + Vitest plugin
└── GitHub Actions  — CI: typecheck → lint → test → build on every push
```

**What the migration proves:** knowing when to use vanilla and when to add tooling is a more valuable skill than defaulting to a framework from the start.

---

## Why it's worth reading the code

Three things that rarely appear together in portfolio projects:

### Typed API boundary with strict null handling

Every shape returned by PokéAPI is modelled in `src/types.ts`. The `types` field on `Pokemon` is typed as `[PokemonType, ...PokemonType[]]` — a tuple that guarantees at least one element, so `pokemon.types[0]` never needs a null check. `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in `tsconfig.json` make TypeScript reject any unsafe assumption about optional data.

### Keyboard accessibility following WAI-ARIA guidelines

Focus is **trapped inside the modal** (Tab/Shift+Tab cycle through interactive elements only), **ESC closes** the overlay, **arrow keys navigate** between cards, and focus **restores to the previously active element** on close. Keyboard and mouse modes are mutually exclusive — moving the mouse removes the keyboard focus ring immediately.

### Holographic shimmer that actually follows the cursor

Mouse position is tracked via `mousemove` (throttled with `requestAnimationFrame`), normalized to `--x`/`--y` CSS custom properties, and consumed by a pseudo-element gradient using `mix-blend-mode: color-dodge`. The gradient position shifts with the cursor, replicating the light-shift of physical Pokémon trading cards.

---

## Quick start

```bash
git clone https://github.com/MihaelaAghirculesei/Pokedex.git
cd Pokedex
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests with Vitest |
| `npm run test:coverage` | Tests + coverage report (HTML + lcov) |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run lint` | ESLint on `src/` |

---

## Features

<table>
<tr>
<td width="50%">

**Core**
- Type-based dynamic color theming on cards
- Search by name (substring) **or by Pokémon ID number** — with 300ms debounce
- Progressive "Load More" pagination
- Tabbed detail overlay (About, Base Stats, Moves)
- Visual stat bars via `<progress>` element with formatted names (HP, Sp. Attack…)
- Slide animation on prev/next Pokémon navigation
- **DE / EN language toggle** — persisted across pages via `localStorage`
- `prefers-reduced-motion` — all animations disabled for users who request it

</td>
<td width="50%">

**PWA / Offline**
- Workbox Service Worker — auto-generated, cache-first strategy
- API responses cached up to 7 days (300 entries max)
- Pokémon sprites cached up to 30 days (600 entries max)
- Custom 404 page consistent with the app design
- Installable on desktop and mobile
- `manifest.json` with separate `maskable` and `any` icons

</td>
</tr>
</table>

---

## Keyboard navigation

| Key | Context | Action |
|-----|---------|--------|
| `→` / `←` | Card grid | Navigate between Pokémon cards |
| `Enter` / `Space` | Focused card | Open detail overlay |
| `ESC` | Overlay open | Close overlay, restore focus |
| `→` / `←` | Overlay open | Browse to next / previous Pokémon |
| `Tab` / `Shift+Tab` | Overlay open | Cycle through overlay controls (focus trapped) |

- Reaching the last card with `→` moves focus to **Load More**
- After loading more Pokémon, focus jumps automatically to the first new card

---

## Screenshots

<div align="center">
<table>
<tr>
<td align="center">
<img src="public/imgs/readme/interface.png" width="200px" alt="Main grid"/>
<br/><sub>Main grid</sub>
</td>
<td align="center">
<img src="public/imgs/readme/interactive_cards.png" width="200px" alt="Holographic hover effect"/>
<br/><sub>Holographic hover</sub>
</td>
<td align="center">
<img src="public/imgs/readme/detailed_view.png" width="200px" alt="Detail overlay"/>
<br/><sub>Detail overlay</sub>
</td>
</tr>
</table>
</div>

---

## Tech

| Layer | Phase 1 — Vanilla JS | Phase 2 — TypeScript |
|-------|----------------------|----------------------|
| Language | Vanilla JavaScript (ES6+) | TypeScript 6 — strict mode |
| Build | None (direct file serving) | Vite 7 — HMR + optimized bundles |
| Offline | Hand-crafted Service Worker | Workbox via vite-plugin-pwa |
| Testing | None | Vitest 4 — 53 unit tests |
| Linting | None | ESLint + typescript-eslint strict |
| Styling | CSS3 — Grid, Flexbox, Custom Properties | Unchanged |
| Data | PokéAPI v2 via Fetch + AbortController | Unchanged |
| Security | — | DOMPurify — sanitizes all injected HTML |
| Accessibility | WAI-ARIA, focus trap, keyboard nav | Unchanged |

---

## Install as PWA

**Desktop (Chrome / Edge):** click the install icon in the address bar → runs in a standalone window.

**Android:** Menu → *Add to Home screen* or *Install app*.

**iOS / Safari:** Share → *Add to Home Screen*.

---

## Contact

[![Portfolio](https://img.shields.io/badge/Portfolio-aghirculesei.pages.dev-FF6B6B?style=flat&logo=firefox&logoColor=white)](https://aghirculesei.pages.dev/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Mihaela_Aghirculesei-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mihaela-aghirculesei-84147a23b/)
[![GitHub](https://img.shields.io/badge/GitHub-MihaelaAghirculesei-181717?style=flat&logo=github&logoColor=white)](https://github.com/MihaelaAghirculesei)
[![Email](https://img.shields.io/badge/Email-aghirculesei@gmail.com-EA4335?style=flat&logo=gmail&logoColor=white)](mailto:aghirculesei@gmail.com)

---

## License

MIT — Pokémon data via [PokéAPI](https://pokeapi.co/docs/v2).
