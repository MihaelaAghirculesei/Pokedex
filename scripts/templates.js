/**
 * Generates an HTML template for a Pokémon card.
 * @param {Object} pokemon - The Pokémon data.
 * @returns {string} The HTML template for the Pokémon card.
 */
function createPokemonCardTemplate(pokemon) {
  const typesButtons = pokemon.types.map(type => createTypeButtonTemplate(type)).join("");
  return `
    <div class="pokemon-card-header">
      <h3 class="pokemon-name">${pokemon.name}</h3>
      <p class="pokemon-number">${pokemon.id}</p>
    </div>
    <div class="pokemon-image-container">
      <img class="pokemon-image" src="${pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}" alt="Official artwork of ${pokemon.name}" loading="lazy">
    </div>
    <div class="pokemon-card-footer">${typesButtons}</div>
  `;
}

/**
* Generates an HTML template for the Pokémon details overlay.
* @param {Object} pokemon - The Pokémon data.
* @param {number} height - The height of the Pokémon in meters.
* @param {number} weight - The weight of the Pokémon in kilograms.
* @param {string} abilities - The abilities of the Pokémon.
* @returns {string} The HTML template for the Pokémon details.
*/
function detailTemplate (pokemon, height, weight, abilities) {
  const typeButtons = pokemon.types.map(type => createTypeButtonTemplate(type)).join("");
  
  return `
    ${createDetailsHeader(pokemon)}
    ${createImageSection(pokemon)}
    ${createTypeButtonContainer(typeButtons)}
    ${createDetailOverlay(pokemon, height, weight, abilities)}
  `;
}

/**
 * Creates the header section for Pokemon details.
 * @param {Object} pokemon - The Pokemon data.
 * @returns {string} The HTML template for the details header.
 */
function createDetailsHeader(pokemon) {
  return `<div class="details-header">
      <h2 style="display: inline-block; margin-right: 10px; text-transform: capitalize;">${pokemon.name}</h2>
      <span style="display: inline-block; font-size: 1.5rem; font-weight: bold;">${pokemon.id}</span>
    </div>`;
}

/**
 * Creates the image section for Pokemon details.
 * @param {Object} pokemon - The Pokemon data.
 * @returns {string} The HTML template for the image section.
 */
function createImageSection(pokemon) {
  return `<div class="pokemon-image-section">
      <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}" class="details-image" loading="lazy">
    </div>`;
}

/**
 * Creates a container for type buttons.
 * @param {string} typeButtons - The HTML string for type buttons.
 * @returns {string} The HTML template for the type button container.
 */
function createTypeButtonContainer(typeButtons) {
  return `<div class="type-button-container">${typeButtons}</div>`;
}

/**
 * Creates the main overlay containing all Pokemon detail tabs.
 * @param {Object} pokemon - The Pokemon data.
 * @param {number} height - The Pokemon height in meters.
 * @param {number} weight - The Pokemon weight in kilograms.
 * @param {string} abilities - The Pokemon abilities.
 * @returns {string} The HTML template for the detail overlay.
 */
function createDetailOverlay(pokemon, height, weight, abilities) {
  return `
    <div class="detail-overlay">
      ${createTabContainer()}
      ${createAboutTab(pokemon, height, weight, abilities)}
      ${createBaseStatsTab(pokemon)}
      ${createMovesTab(pokemon)}
    </div>
  `;
}

/**
 * Creates the tab navigation container.
 * @returns {string} The HTML template for the tab container.
 */
function createTabContainer() {
  return `<div class="tab-container">
      <button class="tab-button active" onclick="openTab(event, 'About')">About</button>
      <button class="tab-button" onclick="openTab(event, 'BaseStats')">Base Stats</button>
      <button class="tab-button" onclick="openTab(event, 'Moves')">Moves</button>
    </div>`;
}

/**
 * Creates the About tab content.
 * @param {Object} pokemon - The Pokemon data.
 * @param {number} height - The Pokemon height in meters.
 * @param {number} weight - The Pokemon weight in kilograms.
 * @param {string} abilities - The Pokemon abilities.
 * @returns {string} The HTML template for the About tab.
 */
function createAboutTab(pokemon, height, weight, abilities) {
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

/**
 * Creates the Base Stats tab content.
 * @param {Object} pokemon - The Pokemon data.
 * @returns {string} The HTML template for the Base Stats tab.
 */
function createBaseStatsTab(pokemon) {
  return `<div id="BaseStats" class="tab-content" style="display: none;">
      <div class="tab-table">
        <table>
          ${pokemon.stats.map(stat => `<tr><th>${capitalizeFirstLetter(stat.stat.name)}:</th><td><progress value="${stat.base_stat}" max="200"></progress>${stat.base_stat}</td></tr>`).join("")}
        </table>
      </div>
    </div>`;
}

/**
 * Creates the Moves tab content.
 * @param {Object} pokemon - The Pokemon data.
 * @returns {string} The HTML template for the Moves tab.
 */
function createMovesTab(pokemon) {
  return `<div id="Moves" class="tab-content" style="display: none;">
      <div class="moves-container" id="moves-${pokemon.id}">Loading moves...</div>
    </div>`;
}

/**
 * Generates an HTML template for error messages.
 * @param {string} message - The error message to display.
 * @returns {string} The HTML template for the error message.
 */
function errorMessageTemplate(message) {
  return `<div class="error-message"><p>${message}</p><button class="button" onclick="init()">Try Again</button></div>`;
}

/**
 * Generates an HTML template for moves loading error.
 * @returns {string} The HTML template for moves loading error.
 */
const movesErrorTemplate = () => '<p>Failed to load moves</p>';

/**
 * Creates an HTML template for a type button element.
 * @param {Object} type - The Pokémon type.
 * @returns {string} The HTML string for the type button.
 */
function createTypeButtonTemplate(type) {
  return `<button class="type-button">
      <img class="type-icon" src="${getTypeIconSrc(type.type.name)}" alt="${type.type.name}">
      <span>${type.type.name}</span>
    </button>`;
}

/**
 * Creates HTML template for moves list - grid without outer border
 * @param {Array} moves - Array of move objects
 * @returns {string} HTML string for moves
 */
function createMovesHTMLTemplate(moves) {
  return `<div class="moves-table-content">
      ${moves.map(move => `<span class="move-compact-tag">${addHyphenation(move.name)}</span>`).join('')}
    </div>`;
}
