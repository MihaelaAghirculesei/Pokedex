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

  function detailTemplate (pokemon, height, weight, abilities) {
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

  function statRowTemplate(stat){
    return`
    <div class="stat-row">
      <span>${capitalizeFirstLetter(stat.stat.name)}</span>
      <progress value="${stat.base_stat}" max="200"></progress>
      <span>${stat.base_stat}</span>
    </div>
  `;
}
