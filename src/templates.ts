import { getTypeIconSrc, formatStatName, addHyphenation } from './utils.js';
import type { Pokemon, PokemonType } from './types.js';

const FALLBACK_IMAGE = 'imgs/icons/pokemon-ball.png';

export function createPokemonCardTemplate(pokemon: Pokemon, isFirst = false): string {
  const typesButtons = pokemon.types.map(type => createTypeButtonTemplate(type)).join('');
  const src = pokemon.sprites.other['official-artwork'].front_default
    ?? pokemon.sprites.front_default
    ?? FALLBACK_IMAGE;
  const imgAttrs = isFirst ? 'fetchpriority="high"' : 'loading="lazy"';

  return `
    <div class="pokemon-card-header">
      <h3 class="pokemon-name">${pokemon.name}</h3>
      <p class="pokemon-number">${pokemon.id}</p>
    </div>
    <div class="pokemon-image-container">
      <img class="pokemon-image" src="${src}" alt="Official artwork of ${pokemon.name}" ${imgAttrs}>
    </div>
    <div class="pokemon-card-footer">${typesButtons}</div>
  `;
}

export function detailTemplate(
  pokemon: Pokemon,
  height: string,
  weight: string,
  abilities: string
): string {
  const typeButtons = pokemon.types.map(type => createTypeButtonTemplate(type)).join('');
  const src = pokemon.sprites.other['official-artwork'].front_default
    ?? pokemon.sprites.front_default
    ?? FALLBACK_IMAGE;

  return `
    ${createDetailsHeader(pokemon)}
    ${createImageSection(src, pokemon.name)}
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
      ${moves.map(move => `<span class="move-compact-tag">${addHyphenation(move.name)}</span>`).join('')}
    </div>`;
}

function createDetailsHeader(pokemon: Pokemon): string {
  return `<div class="details-header">
      <h2>${pokemon.name}</h2>
      <span>${pokemon.id}</span>
    </div>`;
}

function createImageSection(src: string, name: string): string {
  return `<div class="pokemon-image-section">
      <img src="${src}" alt="Official artwork of ${name}" class="details-image" loading="lazy">
    </div>`;
}

function createDetailOverlay(
  pokemon: Pokemon,
  height: string,
  weight: string,
  abilities: string
): string {
  return `
    <div class="detail-overlay">
      <div class="tab-container">
        <button class="tab-button active" data-tab="About">About</button>
        <button class="tab-button" data-tab="BaseStats">Base Stats</button>
        <button class="tab-button" data-tab="Moves">Moves</button>
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
  abilities: string
): string {
  return `<div id="About" class="tab-content">
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
    .map(stat => `<tr><th>${formatStatName(stat.stat.name)}:</th><td><progress value="${stat.base_stat}" max="200"></progress>${stat.base_stat}</td></tr>`)
    .join('');

  return `<div id="BaseStats" class="tab-content" style="display: none;">
      <div class="tab-table">
        <table>${rows}</table>
      </div>
    </div>`;
}

function createMovesTab(pokemon: Pokemon): string {
  return `<div id="Moves" class="tab-content" style="display: none;">
      <div class="moves-container" id="moves-${pokemon.id}" data-loaded="false" data-pokemon-id="${pokemon.id}">Loading moves...</div>
    </div>`;
}

function createTypeButtonTemplate(type: PokemonType): string {
  return `<span class="type-button">
      <img class="type-icon" src="${getTypeIconSrc(type.type.name)}" alt="${type.type.name}">
      <span>${type.type.name}</span>
    </span>`;
}
