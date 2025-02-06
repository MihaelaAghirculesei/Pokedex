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
      const pokemonType = pokemon.types[0].type.name;
      const backgroundColor = typeColor[pokemonType] || '#ffffff';
      
      pokedexContainer.innerHTML += `
        <div class="pokemon-card" style="background-color: ${backgroundColor}">
          <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
          <h3>${pokemon.name}</h3>
          <p>Nr. ${pokemon.id}</p>
          <p>Typ: ${pokemonType}</p>
        </div>
      `;
    });
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