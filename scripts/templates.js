function createPokemonCardTemplate(pokemon) {
    const typesButtons = pokemon.types.map(type => createTypeButton(type)).join("");
  
    return `
      <div class="pokemon-card-header">
        <h3 class="pokemon-name">${pokemon.name}</h3>
        <p class="pokemon-number">${pokemon.id.toString().padStart(3, "0")}</p>
      </div>
      <div class="pokemon-image-container">
        <img class="pokemon-image" src="${pokemon.sprites.other["official-artwork"].front_default || pokemon.sprites.front_default}" alt="Offizielle Abbildung von ${pokemon.name}">
      </div>
      <div class="pokemon-card-footer">
        ${typesButtons}
      </div>
    `;
  }



