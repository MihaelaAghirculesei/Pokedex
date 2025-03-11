let canvas;
let world;
let keyboard = new Keyboard();

function init() {
<<<<<<< HEAD
  canvas = document.getElementById('canvas');
  world = new world(canvas, keyboard);

  

console.log('My Character is', world.character);

=======
  canvas = document.getElementById("canvas");
  // ctx = canvas.getContext("2d"); // ctx ist variable Name
world = new World(canvas, keyboard);

console.log('My Character is', world.character);
>>>>>>> mein-neuer-branch
}

window.addEventListener("keydown", (e) => {
  if (e.keyCode == 39) {
      keyboard.RIGHT = true;
  }
<<<<<<< HEAD

  if (e.keyCode == 37) {
      keyboard.LEFT = true;
  }

  if (e.keyCode == 38) {
      keyboard.UP = true;
  }

  if (e.keyCode == 40) {
      keyboard.DOWN = true;
  }

  if (e.keyCode == 32) {
      keyboard.SPACE = true;
  }
  console.log(e);
});

=======
  if (e.keyCode == 37) {
      keyboard.LEFT = true;
  }
  if (e.keyCode == 38) {
      keyboard.UP = true;
  }
  if (e.keyCode == 40) {
      keyboard.DOWN = true;
  }
  if (e.keyCode == 32) {
      keyboard.SPACE = true;
  }
});
>>>>>>> mein-neuer-branch
window.addEventListener("keyup", (e) => {
  if (e.keyCode == 39) {
      keyboard.RIGHT = false;
  }
<<<<<<< HEAD

  if (e.keyCode == 37) {
      keyboard.LEFT = false;
  }

  if (e.keyCode == 38) {
      keyboard.UP = false;
  }

  if (e.keyCode == 40) {
      keyboard.DOWN = false;
  }

=======
  if (e.keyCode == 37) {
      keyboard.LEFT = false;
  }
  if (e.keyCode == 38) {
      keyboard.UP = false;
  }
  if (e.keyCode == 40) {
      keyboard.DOWN = false;
  }
>>>>>>> mein-neuer-branch
  if (e.keyCode == 32) {
      keyboard.SPACE = false;
  }
});

<<<<<<< HEAD
// ctx = canvas.getContext("2d"); // ctx ist variable Name
=======
>>>>>>> mein-neuer-branch
// das steht normalaweise in der Function init

//  console.log('My Character is', world['character']);

  //PROBE
  // character.src = '../img_pollo_locco/img/2_character_pepe/1_idle/idle/I-1.png';
  // ctx.drawImage(character, 20, 20, 50, 150); // Coordinate 20, 20 + breite 50, hoch 150px

  // KONTROLE BILD, Copy relative Path
  // setTimeout (function(){
  //     ctx.drawImage(character, 20, 20, 50, 150); // Coordinate 20, 20 + breite 50, hoch 150px
  // }, 2000);
