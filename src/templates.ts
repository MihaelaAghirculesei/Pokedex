import { getTypeIconSrc, formatStatName, addHyphenation, formatMoveName } from './utils.js';
import type { Pokemon, PokemonType } from './types.js';

const FALLBACK_IMAGE = 'imgs/icons/pokemon-ball.webp';

function optimizeImageUrl(url: string, width: number): string {
  if (!url.startsWith('https://')) return url;
  return `https://wsrv.nl/?url=${url.slice(8)}&output=webp&q=85&w=${width}&maxage=30d`;
}

export function createPokemonCardTemplate(pokemon: Pokemon, isFirst = false): string {
  const typesButtons = pokemon.types.map((type) => createTypeButtonTemplate(type)).join('');
  const rawSrc =
    pokemon.sprites.other['official-artwork'].front_default ??
    pokemon.sprites.front_default ??
    FALLBACK_IMAGE;
  const imgAttrs = isFirst
    ? 'fetchpriority="high" decoding="async"'
    : 'loading="lazy" decoding="async"';
  const src = optimizeImageUrl(rawSrc, 280);
  const srcsetAttr = rawSrc.startsWith('https://')
    ? `srcset="${optimizeImageUrl(rawSrc, 150)} 150w, ${optimizeImageUrl(rawSrc, 280)} 280w, ${optimizeImageUrl(rawSrc, 480)} 480w" sizes="(max-width: 432px) 150px, 240px"`
    : '';

  return `
    <div class="pokemon-card-header">
      <h3 class="pokemon-name">${formatMoveName(pokemon.name)}</h3>
      <p class="pokemon-number">${pokemon.id}</p>
    </div>
    <div class="pokemon-image-container">
      <img class="pokemon-image" src="${src}" alt="Official artwork of ${formatMoveName(pokemon.name)}" width="240" height="240" ${srcsetAttr} ${imgAttrs}>
    </div>
    <div class="pokemon-card-footer">${typesButtons}</div>
  `;
}

export function detailTemplate(
  pokemon: Pokemon,
  height: string,
  weight: string,
  abilities: string,
): string {
  const typeButtons = pokemon.types.map((type) => createTypeButtonTemplate(type)).join('');
  const src =
    pokemon.sprites.other['official-artwork'].front_default ??
    pokemon.sprites.front_default ??
    FALLBACK_IMAGE;

  return `
    ${createDetailsHeader(pokemon)}
    ${createImageSection(src, pokemon.name)}
    <p class="keyboard-shortcuts-hint" aria-hidden="true">⌨ <kbd>←</kbd><kbd>→</kbd> Pokémon &nbsp;·&nbsp; <kbd>↑</kbd><kbd>↓</kbd> tabs &nbsp;·&nbsp; <kbd>Esc</kbd> close</p>
    <div class="type-button-container">${typeButtons}</div>
    ${createDetailOverlay(pokemon, height, weight, abilities)}
  `;
}

export function errorMessageTemplate(message: string): string {
  return `<div class="error-message"><p>${message}</p><button class="button retry-btn">Try Again</button></div>`;
}

export const movesErrorTemplate = (): string => '<p>Failed to load moves</p>';

export function createMovesHTMLTemplate(moves: { name: string }[]): string {
  return `<div class="moves-table-content">
      ${moves.map((move) => `<span class="move-compact-tag">${addHyphenation(formatMoveName(move.name))}</span>`).join('')}
    </div>`;
}

function createDetailsHeader(pokemon: Pokemon): string {
  return `<div class="details-header">
      <h2>${formatMoveName(pokemon.name)}</h2>
      <span>${pokemon.id}</span>
    </div>`;
}

function createImageSection(src: string, name: string): string {
  const optimized = optimizeImageUrl(src, 475);
  return `<div class="pokemon-image-section">
      <img src="${optimized}" alt="Official artwork of ${formatMoveName(name)}" class="details-image" width="475" height="475">
    </div>`;
}

function createDetailOverlay(
  pokemon: Pokemon,
  height: string,
  weight: string,
  abilities: string,
): string {
  return `
    <div class="detail-overlay">
      <div class="tab-container" role="tablist">
        <button class="tab-button active" role="tab" aria-selected="true"  aria-controls="About"     id="tab-About"     data-tab="About">About</button>
        <button class="tab-button"        role="tab" aria-selected="false" aria-controls="BaseStats" id="tab-BaseStats" data-tab="BaseStats">Base Stats</button>
        <button class="tab-button"        role="tab" aria-selected="false" aria-controls="Moves"     id="tab-Moves"     data-tab="Moves">Moves</button>
      </div>
      ${createAboutTab(pokemon, height, weight, abilities)}
      ${createBaseStatsTab(pokemon)}
      ${createMovesTab(pokemon)}
    </div>
  `;
}

function createAboutTab(
  pokemon: Pokemon,
  height: string,
  weight: string,
  abilities: string,
): string {
  return `<div id="About" class="tab-content" role="tabpanel" aria-labelledby="tab-About" tabindex="0">
      <div class="tab-table">
        <table>
          <tr><th>Species:</th><td>${pokemon.species.name}</td></tr>
          <tr><th>Height:</th><td>${height} m</td></tr>
          <tr><th>Weight:</th><td>${weight} kg</td></tr>
          <tr><th>Abilities:</th><td>${abilities}</td></tr>
        </table>
      </div>
    </div>`;
}

function createBaseStatsTab(pokemon: Pokemon): string {
  const rows = pokemon.stats
    .map(
      (stat) =>
        `<tr><th>${formatStatName(stat.stat.name)}:</th><td><progress value="${stat.base_stat}" max="255" aria-label="${formatStatName(stat.stat.name)}"></progress>${stat.base_stat}</td></tr>`,
    )
    .join('');

  return `<div id="BaseStats" class="tab-content" role="tabpanel" aria-labelledby="tab-BaseStats" tabindex="0" style="display: none;">
      <div class="tab-table">
        <table>${rows}</table>
      </div>
    </div>`;
}

function createMovesTab(pokemon: Pokemon): string {
  return `<div id="Moves" class="tab-content" role="tabpanel" aria-labelledby="tab-Moves" tabindex="0" style="display: none;">
      <div class="moves-container" id="moves-${pokemon.id}" data-loaded="false" data-pokemon-id="${pokemon.id}">Loading moves...</div>
    </div>`;
}

function createTypeButtonTemplate(type: PokemonType): string {
  return `<span class="type-button">
      <img class="type-icon" src="${getTypeIconSrc(type.type.name)}" alt="" width="35" height="35" loading="lazy" decoding="async" fetchpriority="low">
      <span>${type.type.name}</span>
    </span>`;
}
