let pokemonDetails = [];
const BASE_URL = "https://pokeapi.co/api/v2/";
let offset = 0;
const limit = 30;

const typeColor = { bug: "#26de81", dragon: "#ffeaa7", electric: "#fed330", fairy: "#FF0069", 
  fighting: "#30336b", fire: "#f0932b", flying: "#81ecec", grass: "#00b894", 
  ground: "#EFB549", ghost: "#a55eea", ice: "#74b9ff", normal: "#95afc0", 
  poison: "#6c5ce7", psychic: "#a29bfe", rock: "#2d3436", water: "#0190FF" };

const loadingIndicator = document.getElementById('loading');
const loadMoreButton = document.getElementById('load-more');

async function init() {
  showLoading();
  await fetchPokemonData();
  initSearch();
  hideLoading();
}

async function fetchPokemonData() {
  const pokemonCache = {};
  try {
    await manageFetchLoading();
    const data = await fetchPokemons();
    const newPokemonDetails = await fetchPokemonDetails(data.results, pokemonCache);
    pokemonDetails.push(...newPokemonDetails);
    offset += limit;
    renderPokemon();
  } catch (error) {
    handleFetchError(error);
  } finally {
    resetFetchLoading();
  }
}

async function manageFetchLoading() {
  showLoading();
  loadMoreButton.disabled = true;
}

async function fetchPokemons() {
  const response = await fetch(`${BASE_URL}pokemon?offset=${offset}&limit=${limit}`);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  return await response.json();
}

async function fetchPokemonDetails(results, cache) {
  return await Promise.all(results.map(async (pokemon) => {
    if (cache[pokemon.name]) return cache[pokemon.name];
    const details = await fetchPokemonDetail(pokemon.url);
    cache[pokemon.name] = details;
    return details;
  }));
}

async function fetchPokemonDetail(url) {
  const res = await fetch(url);
  return await res.json();
}

function handleFetchError(error) {
  console.error("Fetch error:", error);
  showError("Failed to load Pokémon data. Please try again later.");
}

function resetFetchLoading() {
  hideLoading();
  loadMoreButton.disabled = false;
}

function initSearch() {
  const searchInput = document.getElementById("search-input");
  let timeoutId;

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 3) return renderPokemon(pokemonDetails.slice(0, 30));
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handleSearch(searchTerm), 300);
  });
}

function handleSearch(searchTerm) {
  const filtered = pokemonDetails.filter(pokemon => pokemon.name.toLowerCase().startsWith(searchTerm)).slice(0, 10);
  renderPokemon(filtered.length ? filtered : displayError(`Keine Pokémon gefunden für "${searchTerm}".`));
}

function renderPokemon(pokemonArray = pokemonDetails) {
  const pokedexContainer = document.getElementById("pokedex-container");
  const fragment = document.createDocumentFragment();
  
  pokemonArray.forEach(pokemon => fragment.appendChild(createPokemonCard(pokemon)));  
  pokedexContainer.replaceChildren(fragment);
  addCardHoverEffects();
}

function createPokemonCard(pokemon) {
  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.dataset.name = pokemon.name; 
  card.style.backgroundColor = typeColor[pokemon.types[0].type.name] || "#ffffff";
  setInnerHTML(card, pokemon);
  return card;
}

function setInnerHTML(card, pokemon) {
  card.innerHTML = createPokemonCardTemplate(pokemon);
}

function createTypeButton(type) {
  return `
    <button class="type-button">
      <img class="type-icon" src="${getTypeIconSrc(type.type.name)}" alt="${type.type.name}">
      <span>${type.type.name}</span>
    </button>
  `;
}

function displayError(message) {
  const container = document.getElementById("pokedex-container");
  container.innerHTML = `<div class="error-message"><p>${message}</p><button onclick="init()">Wiederholen</button></div>`;
}

function getTypeIconSrc(type) {
  const typeIcons = { water: "imgs/icons/water.png", grass: "imgs/icons/grass.png", 
    fire: "imgs/icons/fire.png", normal: "imgs/icons/normal.png", bug: "imgs/icons/bug.png", 
    poison: "imgs/icons/poison.png", electric: "imgs/icons/electric.png", ground: "imgs/icons/ground.png", 
    flying: "imgs/icons/flying.png", psychic: "imgs/icons/psychic.png", 
    fairy: "imgs/icons/fairy.png", fighting: "imgs/icons/fighting.png", 
    rock: "imgs/icons/rock.png", steel: "imgs/icons/steel.png", ice: "imgs/icons/ice.png", 
    ghost: "imgs/icons/ghost.png", dark: "imgs/icons/dark.png", dragon: "imgs/icons/dragon.png" 
  };
  return typeIcons[type] || "imgs/icons/default.png";
}

function addCardHoverEffects() {
  const cards = document.querySelectorAll(".pokemon-card");
  cards.forEach(card => {
    card.addEventListener("mousemove", handleHover);
    card.addEventListener("mouseleave", resetCard);
  });
}

function handleHover(e) {
  setHoverEffect.call(this, e);
}

function setHoverEffect(e) {
  const { clientX, clientY } = e;
  const { left, top, width, height } = this.getBoundingClientRect();
  const x = (clientX - left) / width;
  const y = (clientY - top) / height;
  this.style.setProperty("--x", `${x * 100}%`);
  this.style.setProperty("--y", `${y * 100}%`);
}

function resetCard() {
  this.style.setProperty("--x", "50%");
  this.style.setProperty("--y", "50%");
}

document.addEventListener("DOMContentLoaded", init);

function createDetailsHTML(pokemon) {
  const height = (pokemon.height / 10).toFixed(1);
  const weight = (pokemon.weight / 10).toFixed(1);
  const abilities = pokemon.abilities.map(a => a.ability.name).join(", ");
  
  return `
    <div class="details-header">
      <h2 style="display: inline-block; margin-right: 10px; text-transform: capitalize;">${pokemon.name}</h2>
      <span style="display: inline-block;">${pokemon.id.toString().padStart(3, "0")}</span>
    </div>
    <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}" class="details-image">
    <div class="detail-overlay">
      <div class="tab-container">
        <button class="tab-button active" onclick="openTab(event, 'About')">About</button>
        <button class="tab-button" onclick="openTab(event, 'BaseStats')">Base Stats</button>
      </div>
      <div id="About" class="tab-content">
        <div class="tab-table">
          <table>
            <tr><th>Species:</th><td>${pokemon.species.name}</td></tr>
            <tr><th>Height:</th><td>${height} m</td></tr>
            <tr><th>Weight:</th><td>${weight} kg</td></tr>
            <tr><th>Abilities:</th><td>${abilities}</td></tr>
          </table>
        </div>
      </div>
      <div id="BaseStats" class="tab-content" style="display: none;">
        ${pokemon.stats.map(stat => createStatRow(stat)).join("")}
      </div>
    </div>
  `;
}

function createStatRow(stat) {
  return `
    <div class="stat-row">
      <span>${stat.stat.name}</span>
      <progress value="${stat.base_stat}" max="200"></progress>
      <span>${stat.base_stat}</span>
    </div>
  `;
}

function openTab(evt, tabName) {
  hideAllTabs();
  showActiveTab(tabName);
  evt.currentTarget.classList.add("active");
}

function hideAllTabs() {
  const tabContent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none";
  }
  const tabButtons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabButtons.length; i++) {
    tabButtons[i].classList.remove("active");
  }
}

function showActiveTab(tabName) {
  document.getElementById(tabName).style.display = "block";
}

function showLoading() {
  loadingIndicator.removeAttribute('hidden');
}

function hideLoading() {
  loadingIndicator.setAttribute('hidden', 'true');
}

function showPokemonDetails(pokemon) {
  const overlay = createOverlay();
  const detailsCard = document.createElement("div");
  detailsCard.className = "details-card";
  detailsCard.innerHTML = createDetailsHTML(pokemon);
  
  appendNavigationButtons(detailsCard, pokemon);
  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeOverlay(overlay);
  });
}

function createOverlay() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  return overlay;
}

function appendNavigationButtons(detailsCard, currentPokemon) {
  detailsCard.appendChild(createButton('prev', currentPokemon));
  detailsCard.appendChild(createButton('next', currentPokemon));
}

function createButton(direction, currentPokemon) {
  const button = document.createElement("button");
  button.textContent = direction === 'prev' ? '<' : '>';
  button.className = `arrow-button ${direction}`;
  button.addEventListener("click", (e) => {
    e.stopPropagation();
    direction === 'prev' ? showPreviousPokemon(currentPokemon) : showNextPokemon(currentPokemon);
  });
  return button;
}

function showPreviousPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const prevIndex = (currentIndex - 1 + pokemonDetails.length) % pokemonDetails.length;
  updateDetailsCard(pokemonDetails[prevIndex]);
}

function showNextPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const nextIndex = (currentIndex + 1) % pokemonDetails.length;
  updateDetailsCard(pokemonDetails[nextIndex]);
}

function updateDetailsCard(pokemon) {
  const detailsCard = document.querySelector(".details-card");
  detailsCard.innerHTML = createDetailsHTML(pokemon);
  appendNavigationButtons(detailsCard, pokemon);
}

function closeOverlay(overlay) {
  document.body.removeChild(overlay);
  document.body.classList.remove("no-scroll");
}

document.getElementById('load-more').addEventListener('click', fetchPokemonData);
document.getElementById("pokedex-container").addEventListener("click", (e) => {
  if (e.target.closest('.pokemon-card')) {
    const pokemonName = e.target.closest('.pokemon-card').dataset.name;
    const pokemon = pokemonDetails.find(p => p.name === pokemonName);
    showPokemonDetails(pokemon);
  }
});