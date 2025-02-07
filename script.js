let pokemonDetails = [];
const BASE_URL = 'https://pokeapi.co/api/v2/';
const cards = document.querySelectorAll('.pokemon-card');

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
    water: "#0190FF"
  };

async function init() {
    await fetchPokemonData();
    renderPokemon();
}

async function fetchPokemonData() {
    try {
        const response = await fetch(`${BASE_URL}pokemon?limit=30`);
        const data = await response.json();
        for (let pokemon of data.results) {
            const detailResponse = await fetch(pokemon.url);
            const detailData = await detailResponse.json();
            pokemonDetails.push(detailData);
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Pokemon-Daten:', error);
    }
}

function renderPokemon() {
    const pokedexContainer = document.getElementById('pokedex-container');
    pokedexContainer.innerHTML = '';
    pokemonDetails.forEach((pokemon, index) => {
      const pokemonTypes = pokemon.types.map(type => type.type.name);
      const backgroundColor = typeColor[pokemonTypes[0]] || '#ffffff';
      
      let typeIconsHTML = '';
      pokemonTypes.forEach(type => {
        const typeIconSrc = getTypeIconSrc(type);
        typeIconsHTML += `
          <div class="type-item">
            <img src="${typeIconSrc}" alt="${type}" class="type-icon">
            <span>${type}</span>
          </div>
        `;
      });
      
      pokedexContainer.innerHTML += `
        <div class="pokemon-card" style="background-color: ${backgroundColor}">
          <div class="card-header">
            <h3 class="pokemon-name">${pokemon.name}</h3>
            <p class="pokemon-number">Nr. ${pokemon.id}</p>
          </div>
          <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="pokemon-image">
          <div class="type-container">
            ${typeIconsHTML}
          </div>
        </div>
      `;
    });
  }
  
  function getTypeIconSrc(type) {
    switch(type) {
      case 'water': return 'imgs/icons/water.png';
      case 'grass': return 'imgs/icons/grass.png';
      case 'fire': return 'imgs/icons/fire.png';
      case 'normal': return 'imgs/icons/normal.png';
      case 'bug': return 'imgs/icons/bug.ia.png';
      case 'poison': return 'imgs/icons/poison.png';
      case 'electric': return 'imgs/icons/electric.ia.png';
      case 'ground': return 'imgs/icons/ground.png';
      case 'flying': return 'imgs/icons/flying.png';
      default: return ''; // Fallback für andere Typen
    }
  }

  cards.forEach(card => {
  card.addEventListener('mousemove', handleHover);
  card.addEventListener('mouseleave', resetCard);
});

function handleHover(e) {
  const { clientX, clientY } = e;
  const { left, top, width, height } = this.getBoundingClientRect();
  const x = (clientX - left) / width;
  const y = (clientY - top) / height;

  this.style.setProperty('--x', `${x * 100}%`);
  this.style.setProperty('--y', `${y * 100}%`);
}

function resetCard() {
  this.style.setProperty('--x', '50%');
  this.style.setProperty('--y', '50%');
}

window.onload = init;