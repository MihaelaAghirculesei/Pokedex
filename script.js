/**
 * Array to store fetched Pokémon details.
 * @type {Array}
 */
let pokemonDetails = [];

/**
 * Base URL for the Pokémon API.
 * @constant {string}
 */
const BASE_URL = "https://pokeapi.co/api/v2/";

/**
 * Offset for paginated API requests.
 * @type {number}
 */
let offset = 0;

/**
 * Number of Pokémon to fetch per request.
 * @constant {number}
 */
const limit = 30;

/**
 * Mapping of Pokémon types to their respective colors.
 * @constant {Object}
 */
const typeColor = {
  bug: "#26de81",
  dragon: "#ffeaa7",
  electric: "#fed330",
  fairy: "#FF0069",
  fighting: "#30336b",
  fire: "#f0932b",
  flying: "#81ecec",
  grass: "#00b894",
  ground: "#EFB549",
  ghost: "#a55eea",
  ice: "#74b9ff",
  normal: "#95afc0",
  poison: "#6c5ce7",
  psychic: "#a29bfe",
  rock: "#2d3436",
  water: "#0190FF",
};

/**
 * Loading indicator element.
 * @constant {HTMLElement}
 */
const loadingIndicator = document.getElementById("loading");

/**
 * Load more button element.
 * @constant {HTMLElement}
 */
const loadMoreButton = document.getElementById("load-more");

/**
 * Cached pokedex container element.
 * @constant {HTMLElement}
 */
const pokedexContainer = document.getElementById("pokedex-container");

/**
 * Initializes the application by fetching Pokémon data and setting up search functionality.
 * @async
 */
async function init() {
  showLoading();
  await fetchPokemonData();
  initSearch();
  hideLoading();
}

/**
 * Fetches Pokémon data and updates the UI.
 * @async
 */
async function fetchPokemonData() {
  const pokemonCache = {};
  try {
    await manageFetchLoading();
    const newPokemonDetails = await fetchAndProcessPokemonData(pokemonCache);
    pokemonDetails.push(...newPokemonDetails);
    offset += limit;
    renderPokemon();
  } catch (error) {
    handleFetchError(error);
  } finally {
    resetFetchLoading();
  }
}

/**
 * Fetches and processes Pokémon data from the API.
 * @async
 * @param {Object} cache - Cache object for Pokémon details.
 * @returns {Promise<Array>} Array of processed Pokémon details.
 */
async function fetchAndProcessPokemonData(cache) {
  const data = await fetchPokemons();
  return await fetchPokemonDetails(data.results, cache);
}

/**
 * Manages loading state during data fetching.
 * @async
 */
async function manageFetchLoading() {
  showLoading();
  loadMoreButton.disabled = true;
}

/**
 * Fetches a list of Pokémon from the API.
 * @async
 * @returns {Promise<Object>} The response data containing Pokémon list.
 */
async function fetchPokemons() {
  const response = await fetch(
    `${BASE_URL}pokemon?offset=${offset}&limit=${limit}`
  );
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return await response.json();
}

/**
 * Fetches detailed data for each Pokémon.
 * @async
 * @param {Array} results - List of Pokémon from the API.
 * @param {Object} cache - Cache object to store already fetched details.
 * @returns {Promise<Array>} Array of Pokémon details.
 */
async function fetchPokemonDetails(results, cache) {
  return await Promise.all(
    results.map(async (pokemon) => {
      if (cache[pokemon.name]) return cache[pokemon.name];
      const details = await fetchPokemonDetail(pokemon.url);
      cache[pokemon.name] = details;
      return details;
    })
  );
}

/**
 * Fetches detailed information for a single Pokémon.
 * @async
 * @param {string} url - API URL for the Pokémon details.
 * @returns {Promise<Object>} The Pokémon detail data.
 */
async function fetchPokemonDetail(url) {
  return (await fetch(url)).json();
}

/**
 * Handles errors occurring during fetch operations.
 * @param {Error} error - The error object.
 */
function handleFetchError(error) {
  showError("Failed to load Pokémon data. Please try again later.");
}

/**
 * Resets the UI state after data fetching.
 */
function resetFetchLoading() {
  hideLoading();
  loadMoreButton.disabled = false;
}

/**
 * Timeout ID for search debouncing.
 * @type {number|null}
 */
let searchTimeoutId = null;

/**
 * Initializes search functionality for filtering Pokémon.
 */
function initSearch() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", handleSearchInput);
}

/**
 * Handles search input events with debouncing.
 * @param {Event} e - The input event.
 */
function handleSearchInput(e) {
  const searchTerm = e.target.value.toLowerCase();
  if (searchTerm.length < 3) return renderPokemon(pokemonDetails.slice(0, 30));
  clearTimeout(searchTimeoutId);
  searchTimeoutId = setTimeout(() => handleSearch(searchTerm), 300);
}

/**
 * Handles search input to filter Pokémon based on user input.
 * @param {string} searchTerm - The user's search term.
 */
function handleSearch(searchTerm) {
  const filtered = pokemonDetails
    .filter((pokemon) => pokemon.name.toLowerCase().startsWith(searchTerm))
    .slice(0, 10);
  renderPokemon(
    filtered.length
      ? filtered
      : displayError(`Keine Pokémon gefunden für "${searchTerm}".`)
  );
}

/**
 * Renders Pokémon data in the UI.
 * @param {Array} [pokemonArray=pokemonDetails] - Array of Pokémon to render.
 */
function renderPokemon(pokemonArray = pokemonDetails) {
  removeCardHoverEffects();
  const fragment = document.createDocumentFragment();

  pokemonArray.forEach((pokemon) =>
    fragment.appendChild(createPokemonCard(pokemon))
  );
  pokedexContainer.replaceChildren(fragment);
  addCardHoverEffects();
}

/**
 * Creates a Pokémon card element.
 * @param {Object} pokemon - The Pokémon data.
 * @returns {HTMLElement} The Pokémon card element.
 */
function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.dataset.name = pokemon.name;
  card.style.backgroundColor =
    typeColor[pokemon.types[0].type.name] || "#ffffff";
  card.innerHTML = createPokemonCardTemplate(pokemon);
  return card;
}

/**
 * Displays an error message in the UI.
 * @param {string} message - The error message.
 */
function displayError(message) {
  pokedexContainer.innerHTML = errorMessageTemplate(message);
}

/**
 * Mapping of Pokémon types to their icon file paths.
 * @constant {Object}
 */
const TYPE_ICONS = {
  water: "imgs/icons/water.png",
  grass: "imgs/icons/grass.png",
  fire: "imgs/icons/fire.png",
  normal: "imgs/icons/normal.png",
  bug: "imgs/icons/bug.png",
  poison: "imgs/icons/poison.png",
  electric: "imgs/icons/electric.png",
  ground: "imgs/icons/ground.png",
  flying: "imgs/icons/flying.png",
  psychic: "imgs/icons/psychic.png",
  fairy: "imgs/icons/fairy.png",
  fighting: "imgs/icons/fighting.png",
  rock: "imgs/icons/rock.png",
  steel: "imgs/icons/steel.png",
  ice: "imgs/icons/ice.png",
  ghost: "imgs/icons/ghost.png",
  dark: "imgs/icons/dark.png",
  dragon: "imgs/icons/dragon.png",
};

/**
 * Retrieves the icon source for a given Pokémon type.
 * @param {string} type - The Pokémon type.
 * @returns {string} The file path of the corresponding type icon.
 */
const getTypeIconSrc = type => TYPE_ICONS[type] || "imgs/icons/default.png";

/**
 * Removes existing hover event listeners from Pokémon cards.
 */
function removeCardHoverEffects() {
  const cards = document.querySelectorAll(".pokemon-card");
  cards.forEach((card) => {
    card.removeEventListener("mousemove", handleHover);
    card.removeEventListener("mouseleave", resetCard);
  });
}

/**
 * Adds hover effects to Pokémon cards.
 */
function addCardHoverEffects() {
  const cards = document.querySelectorAll(".pokemon-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", handleHover);
    card.addEventListener("mouseleave", resetCard);
  });
}

/**
 * Handles mouse hover event on Pokémon cards.
 * @param {MouseEvent} e - The mouse event.
 */
function handleHover(e) {
  const { clientX, clientY } = e;
  const { left, top, width, height } = this.getBoundingClientRect();
  const x = (clientX - left) / width;
  const y = (clientY - top) / height;
  this.style.setProperty("--x", `${x * 100}%`);
  this.style.setProperty("--y", `${y * 100}%`);
}

/**
 * Resets the hover effect on Pokémon cards.
 */
function resetCard() {
  this.style.setProperty("--x", "50%");
  this.style.setProperty("--y", "50%");
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  setTimeout(() => {
    initLogoAnimation();
  }, 1000);
});

/**
 * Initializes logo animation for header and footer.
 */
function initLogoAnimation() {
  const headerLogo = document.querySelector('.header .headline-icon');
  if (headerLogo) {
    headerLogo.classList.add('animate-logo');
  }
  
  const footerLogo = document.querySelector('.footer .headline-icon');
  if (footerLogo) {
    const observer = createLogoObserver();
    observer.observe(footerLogo);
  }
}

/**
 * Creates an intersection observer for logo animation.
 * @returns {IntersectionObserver} The configured observer.
 */
function createLogoObserver() {
  return new IntersectionObserver(handleLogoIntersection, { 
    threshold: 0.5, 
    rootMargin: '0px' 
  });
}

/**
 * Handles logo intersection events for animation.
 * @param {IntersectionObserverEntry[]} entries - The observed entries.
 */
function handleLogoIntersection(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateLogoEntry(entry);
    }
  });
}

/**
 * Animates logo when it enters the viewport.
 * @param {IntersectionObserverEntry} entry - The intersection entry.
 */
function animateLogoEntry(entry) {
  entry.target.classList.remove('animate-logo');
  setTimeout(() => entry.target.classList.add('animate-logo'), 10);
}

/**
 * Creates the details HTML for a Pokémon.
 * @param {Object} pokemon - The Pokémon data.
 * @returns {string} The HTML string for the details section.
 */
function createDetailsHTML(pokemon) {
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities.map((a) => a.ability.name).join(", ");
  return detailTemplate(pokemon, height, weight, abilities);
}


/**
 * Capitalizes the first letter of a string.
 * @param {string} s - The input string.
 * @returns {string} The formatted string.
 */
const capitalizeFirstLetter = s => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Handles tab switching functionality.
 * @param {Event} evt - The event triggering the tab switch.
 * @param {string} tabName - The name of the tab to open.
 */
function openTab(evt, tabName) {
  hideAllTabs();
  showActiveTab(tabName);
  evt.currentTarget.classList.add("active");
  handleTabSpecificActions(tabName);
  
  const detailsCard = document.querySelector('.details-card');
  if (detailsCard) {
    setTimeout(() => {
      addGlitterEffect(detailsCard);
    }, 100);
  }
}

/**
 * Handles tab-specific actions when switching between tabs.
 * @param {string} tabName - The name of the tab being activated.
 */
function handleTabSpecificActions(tabName) {
  const detailsCard = document.querySelector('.details-card');
  if (!detailsCard) return;
  
  if (tabName === 'Moves') {
    detailsCard.classList.add('moves-active');
    loadMovesIfNeeded();
  } else {
    detailsCard.classList.remove('moves-active');
  }
}

/**
 * Loads Pokémon moves if they haven't been loaded yet.
 */
function loadMovesIfNeeded() {
  const movesContainer = document.querySelector('.moves-container');
  if (movesContainer && movesContainer.innerHTML.trim() === 'Loading moves...') {
    const pokemonId = movesContainer.id.replace('moves-', '');
    loadPokemonMoves(pokemonId);
  }
}

/**
 * Hides all tab contents and removes active state from tab buttons.
 */
function hideAllTabs() {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = "none";
  });
  document.querySelectorAll('.tab-button').forEach(button => {
    button.classList.remove("active");
  });
}

/**
 * Displays the specified tab content.
 * @param {string} tabName - The name of the tab to show.
 */
const showActiveTab = tabName => document.getElementById(tabName).style.display = "block";

/**
 * Shows the loading indicator.
 */
const showLoading = () => loadingIndicator.removeAttribute("hidden");

/**
 * Hides the loading indicator.
 */
const hideLoading = () => loadingIndicator.setAttribute("hidden", "true");

/**
 * Displays the details of a selected Pokémon in an overlay.
 * @param {Object} pokemon - The Pokémon data.
 */
function showPokemonDetails(pokemon) {
  const overlay = createOverlay();
  const detailsCard = document.createElement("div");
  detailsCard.className = "details-card";
  detailsCard.style.backgroundColor = typeColor[pokemon.types[0].type.name] || "#ffffff";
  detailsCard.innerHTML = createDetailsHTML(pokemon);
  appendNavigationButtons(detailsCard, pokemon);
  addGlitterEffect(detailsCard);
  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");
  overlay.addEventListener("click", e => e.target === overlay && closeOverlay(overlay));
}

/**
 * Creates an overlay element for displaying Pokémon details.
 * @returns {HTMLElement} The overlay element.
 */
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  return overlay;
}

/**
 * Appends navigation buttons to a Pokémon details card.
 * @param {HTMLElement} detailsCard - The details card element.
 * @param {Object} currentPokemon - The current Pokémon data.
 */
function appendNavigationButtons(detailsCard, currentPokemon) {
  const imageSection = detailsCard.querySelector('.pokemon-image-section');
  if (!imageSection) return;
  
  const prevButton = createButton("prev", currentPokemon);
  const nextButton = createButton("next", currentPokemon);
  
  prevButton.classList.add("arrow-left");
  nextButton.classList.add("arrow-right");
  
  imageSection.appendChild(prevButton);
  imageSection.appendChild(nextButton);
}

/**
 * Creates a navigation button for switching Pokémon details.
 * @param {string} direction - The navigation direction ('prev' or 'next').
 * @param {Object} currentPokemon - The current Pokémon data.
 * @returns {HTMLElement} The navigation button element.
 */
function createButton(direction, currentPokemon) {
  const button = document.createElement("button");
  button.textContent = direction === "prev" ? "<" : ">";
  button.className = `arrow-button ${direction}`;
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    direction === "prev"
      ? showPreviousPokemon(currentPokemon)
      : showNextPokemon(currentPokemon);
  });
  return button;
}

/**
 * Displays the previous Pokémon in the details overlay.
 * @param {Object} currentPokemon - The currently displayed Pokémon.
 */
function showPreviousPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const prevIndex =
    (currentIndex - 1 + pokemonDetails.length) % pokemonDetails.length;
  updateDetailsCard(pokemonDetails[prevIndex]);
}

/**
 * Displays the next Pokémon in the details overlay.
 * @param {Object} currentPokemon - The currently displayed Pokémon.
 */
function showNextPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const nextIndex = (currentIndex + 1) % pokemonDetails.length;
  updateDetailsCard(pokemonDetails[nextIndex]);
}

/**
 * Updates the Pokémon details card with new data.
 * @param {Object} pokemon - The Pokémon data.
 */
function updateDetailsCard(pokemon) {
  const detailsCard = document.querySelector(".details-card");
  if (detailsCard) {
    detailsCard.style.opacity = 0;

    setTimeout(() => {
      detailsCard.style.backgroundColor = typeColor[pokemon.types[0].type.name] || "#ffffff";
      detailsCard.innerHTML = createDetailsHTML(pokemon);
      appendNavigationButtons(detailsCard, pokemon);
      addGlitterEffect(detailsCard);
      detailsCard.style.opacity = 1;
    }, 300);
  }
}

/**
 * Creates and returns glitter DOM elements.
 * @returns {HTMLElement[]} Array of glitter elements.
 */
function createGlitterElements() {
  const glitter1 = document.createElement('div');
  const glitter2 = document.createElement('div');
  glitter1.className = 'glitter-effect glitter-1';
  glitter2.className = 'glitter-effect glitter-2';
  return [glitter1, glitter2];
}

/**
 * Adds glitter effect to a details card using DOM elements.
 * @param {HTMLElement} detailsCard - The details card element.
 */
function addGlitterEffect(detailsCard) {
  const existingGlitter = detailsCard.querySelectorAll('.glitter-effect');
  existingGlitter.forEach(el => el.remove());
  const [glitter1, glitter2] = createGlitterElements();
  detailsCard.appendChild(glitter1);
  detailsCard.appendChild(glitter2);
  attachGlitterListeners(detailsCard, glitter1, glitter2);
}

/**
 * Attaches hover listeners to glitter elements.
 * @param {HTMLElement} detailsCard - The details card element.
 * @param {HTMLElement} glitter1 - First glitter element.
 * @param {HTMLElement} glitter2 - Second glitter element.
 */
function attachGlitterListeners(detailsCard, glitter1, glitter2) {
  detailsCard.addEventListener('mouseenter', () => {
    glitter1.classList.add('active');
    glitter2.classList.add('active');
  });
  
  detailsCard.addEventListener('mouseleave', () => {
    glitter1.classList.remove('active');
    glitter2.classList.remove('active');
  });
}

/**
 * Closes the Pokémon details overlay.
 * @param {HTMLElement} overlay - The overlay element to be removed.
 */
function closeOverlay(overlay) {
  document.body.removeChild(overlay);
  document.body.classList.remove("no-scroll");
}

loadMoreButton.addEventListener("click", fetchPokemonData);
pokedexContainer.addEventListener("click", (e) => {
  if (e.target.closest(".pokemon-card")) {
    const pokemonName = e.target.closest(".pokemon-card").dataset.name;
    const pokemon = pokemonDetails.find((p) => p.name === pokemonName);
    showPokemonDetails(pokemon);
  }
});

/**
 * Adds soft hyphens to words for better text wrapping following English syllabification rules.
 * @param {string} text - The text to add breaks to.
 * @returns {string} Text with soft hyphens added.
 */
function addHyphenation(text) {
  return text.split(' ').map(word => hyphenateWord(word)).join(' ');
}

/**
 * Applies hyphenation rules to a single word.
 * @param {string} word - The word to hyphenate.
 * @returns {string} The hyphenated word.
 */
function hyphenateWord(word) {
  if (word.length <= 6) return word;
  let result = word;
  result = result.replace(/([bcdfghjklmnpqrstvwxyz])\1/gi, '$1­$1');
  result = result.replace(/([aeiou])([bcdfghjklmnpqrstvwxyz])([aeiou])/gi, '$1­$2$3');
  result = result.replace(/([aeiou])([bcdfghjklmnpqrstvwxyz])([bcdfghjklmnpqrstvwxyz])([aeiou])/gi, '$1$2­$3$4');
  result = result.replace(/(un|re|pre|dis|mis|over|under|out)([bcdfghjklmnpqrstvwxyz])/gi, '$1­$2');
  result = result.replace(/([aeiou])ing$/gi, '$1­ing');
  result = result.replace(/([aeiou])ed$/gi, '$1­ed');
  return result;
}

/**
 * Fetches and displays moves for a Pokemon
 * @param {number} pokemonId - The Pokemon ID
 */
async function loadPokemonMoves(pokemonId) {
  const movesContainer = document.getElementById(`moves-${pokemonId}`);
  if (!movesContainer) return;
  
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const pokemon = await response.json();
    
    const moves = pokemon.moves.slice(0, 20).map(moveData => ({
      name: capitalizeFirstLetter(moveData.move.name.replace('-', ' ')),
      learnMethod: capitalizeFirstLetter(moveData.version_group_details[0]?.move_learn_method.name || 'unknown')
    }));
    
    movesContainer.innerHTML = createMovesHTMLTemplate(moves);
  } catch (error) {
    movesContainer.innerHTML = movesErrorTemplate();
  }
}
