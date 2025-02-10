let pokemonDetails = [];
const BASE_URL = "https://pokeapi.co/api/v2/";
let offset = 0;
const limit = 30;

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

async function init() {
  try {
    await fetchPokemonData();
    initSearch();
    renderPokemon();
  } catch (error) {
    showError("Failed to load Pokémon data. Please try again later.");
  }
}

async function fetchPokemonData() {
  try {
    const response = await fetch(`${BASE_URL}pokemon?offset=${offset}&limit=${limit}`);
    const data = await response.json();

    const detailRequests = data.results.map((pokemon) => fetch(pokemon.url));
    const responses = await Promise.all(detailRequests);
    const newPokemonDetails = await Promise.all(responses.map((res) => res.json()));
    
    pokemonDetails = [...pokemonDetails, ...newPokemonDetails];
    offset += limit;

    renderPokemon();
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

document.getElementById('load-more').addEventListener('click', fetchPokemonData);

function initSearch() {
  const searchInput = document.getElementById("search-input");
  let timeoutId;

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 3) {
      renderPokemon(pokemonDetails.slice(0, 30));
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const filtered = pokemonDetails
        .filter((pokemon) => pokemon.name.includes(searchTerm))
        .slice(0, 10);
      renderPokemon(filtered);
    }, 300);
  });
}

function renderPokemon(pokemonArray = pokemonDetails) {
  const pokedexContainer = document.getElementById("pokedex-container");
  const fragment = document.createDocumentFragment();

  pokedexContainer.innerHTML = "";

  pokemonArray.forEach((pokemon) => {
    const card = createPokemonCard(pokemon);
    fragment.appendChild(card);
  });

  pokedexContainer.appendChild(fragment);
  addCardHoverEffects();
}

function createPokemonCard(pokemon) {
  const types = pokemon.types.map((type) => type.type.name);
  const backgroundColor = typeColor[types[0]] || "#ffffff";

  const card = document.createElement("div");
  card.className = "pokemon-card";
  card.style.backgroundColor = backgroundColor;

  const header = document.createElement("div");
  header.className = "pokemon-card-header";

  const name = document.createElement("h3");
  name.className = "pokemon-name";
  name.textContent = pokemon.name;

  const number = document.createElement("p");
  number.className = "pokemon-number";
  number.textContent = `${pokemon.id.toString().padStart(3, "0")}`;

  header.appendChild(name);
  header.appendChild(number);

  const imgContainer = document.createElement("div");
  imgContainer.className = "pokemon-image-container";

  const img = document.createElement("img");
  img.className = "pokemon-image";
  img.src =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;
  img.alt = `Official artwork of ${pokemon.name}`;

  imgContainer.appendChild(img);

  const footer = document.createElement("div");
  footer.className = "pokemon-card-footer";

  types.forEach((type) => {
    const button = document.createElement("button");
    button.className = "type-button";

    const icon = document.createElement("img");
    icon.className = "type-icon";
    icon.src = getTypeIconSrc(type);
    icon.alt = `${type} type icon`;

    const label = document.createElement("span");
    label.textContent = type;

    button.appendChild(icon);
    button.appendChild(label);
    footer.appendChild(button);
  });

  card.appendChild(header);
  card.appendChild(imgContainer);
  card.appendChild(footer);

  card.addEventListener("click", () => showPokemonDetails(pokemon));

  return card;
}

function showError(message) {
  const container = document.getElementById("pokedex-container");
  container.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <button onclick="init()">Retry</button>
        </div>
    `;
}

function getTypeIconSrc(type) {
  const typeIcons = {
    water: "imgs/icons/water.png",
    grass: "imgs/icons/grass.png",
    fire: "imgs/icons/fire.png",
    normal: "imgs/icons/normal.png",
    bug: "imgs/icons/bug.png",
    poison: "imgs/icons/poison.png",
    electric: "imgs/icons/electric.png",
    ground: "imgs/icons/ground.png",
    flying: "imgs/icons/flying.png",
  };
  return typeIcons[type] || "imgs/icons/default.png";
}

function addCardHoverEffects() {
  const cards = document.querySelectorAll(".pokemon-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", handleHover);
    card.addEventListener("mouseleave", resetCard);
  });
}

function handleHover(e) {
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

function showPokemonDetails(pokemon) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const detailsCard = document.createElement("div");
  detailsCard.className = "details-card";
  detailsCard.innerHTML = createDetailsHTML(pokemon);

  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      document.body.classList.remove("no-scroll");
    }
  });
}

function createDetailsHTML(pokemon) {
  return `
        <div class="details-header">
            <h2>${pokemon.name}</h2>
            <span>#${pokemon.id.toString().padStart(3, "0")}</span>
        </div>
        <img src="${pokemon.sprites.other["official-artwork"].front_default}" 
             alt="${pokemon.name}" 
             class="details-image">
        <div class="stats-container">
            ${pokemon.stats
              .map(
                (stat) => `
                <div class="stat-row">
                    <span>${stat.stat.name}</span>
                    <progress value="${stat.base_stat}" max="200"></progress>
                    <span>${stat.base_stat}</span>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function createCardHeader(pokemon) {
  return `
        <div class="pokemon-card-header">
            <h3 class="pokemon-name">${pokemon.name}</h3>
            <p class="pokemon-number">#${pokemon.id
              .toString()
              .padStart(3, "0")}</p>
        </div>
    `;
}

function createCardFooter(types) {
  return types
    .map(
      (type) => `
        <button class="type-button">
            <img src="${getTypeIconSrc(type)}" class="type-icon" alt="${type}">
            <span>${type}</span>
        </button>
    `
    )
    .join("");
}

const loadingIndicator = document.getElementById('loading');
const loadMoreButton = document.getElementById('load-more');

async function fetchPokemonData() {
  showLoading(); // Zeige den Ladebildschirm
  loadMoreButton.disabled = true; // Deaktiviere den Button

  try {
    const response = await fetch(`${BASE_URL}pokemon?offset=${offset}&limit=${limit}`);
    const data = await response.json();

    const detailRequests = data.results.map((pokemon) => fetch(pokemon.url));
    const responses = await Promise.all(detailRequests);
    const newPokemonDetails = await Promise.all(responses.map((res) => res.json()));

    pokemonDetails = [...pokemonDetails, ...newPokemonDetails];
    offset += limit;

    renderPokemon();
  } catch (error) {
    console.error("Fetch error:", error);
    showError("Failed to load Pokémon data. Please try again later.");
  } finally {
    hideLoading(); // Verstecke den Ladebildschirm
    loadMoreButton.disabled = false; // Aktiviere den Button wieder
  }
}

function showLoading() {
  loadingIndicator.removeAttribute('hidden');
}

function hideLoading() {
  loadingIndicator.setAttribute('hidden', 'true');
}

function showPokemonDetails(pokemon) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const detailsCard = document.createElement("div");
  detailsCard.className = "details-card";
  detailsCard.innerHTML = createDetailsHTML(pokemon);

  // Pfeile hinzufügen
  const prevButton = document.createElement("button");
  prevButton.textContent = "<";
  prevButton.className = "arrow-button prev";
  prevButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Verhindert, dass der Overlay-Click ausgelöst wird
      showPreviousPokemon(pokemon);
  });

  const nextButton = document.createElement("button");
  nextButton.textContent = ">";
  nextButton.className = "arrow-button next";
  nextButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showNextPokemon(pokemon);
  });

  detailsCard.appendChild(prevButton);
  detailsCard.appendChild(nextButton);

  overlay.appendChild(detailsCard);
  document.body.appendChild(overlay);
  document.body.classList.add("no-scroll");

  overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
          closeOverlay(overlay);
      }
  });
}

function showPreviousPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const prevIndex = (currentIndex - 1 + pokemonDetails.length) % pokemonDetails.length;
  const prevPokemon = pokemonDetails[prevIndex];
  updateDetailsCard(prevPokemon);
}

function showNextPokemon(currentPokemon) {
  const currentIndex = pokemonDetails.indexOf(currentPokemon);
  const nextIndex = (currentIndex + 1) % pokemonDetails.length;
  const nextPokemon = pokemonDetails[nextIndex];
  updateDetailsCard(nextPokemon);
}

function updateDetailsCard(pokemon) {
  const detailsCard = document.querySelector(".details-card");
  detailsCard.innerHTML = createDetailsHTML(pokemon);

  // Füge die Pfeile wieder hinzu, da innerHTML alles ersetzt
  const prevButton = document.createElement("button");
  prevButton.textContent = "<";
  prevButton.className = "arrow-button prev";
  prevButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showPreviousPokemon(pokemon);
  });

  const nextButton = document.createElement("button");
  nextButton.textContent = ">";
  nextButton.className = "arrow-button next";
  nextButton.addEventListener("click", (e) => {
      e.stopPropagation();
      showNextPokemon(pokemon);
  });

  detailsCard.appendChild(prevButton);
  detailsCard.appendChild(nextButton);
}

function closeOverlay(overlay) {
  document.body.removeChild(overlay);
  document.body.classList.remove("no-scroll");
}
