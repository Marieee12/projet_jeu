const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// Mette à jour l'état du jeu (positions, collisions, etc.)
function update() {
  // logique
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  update(); 
  draw();  
  requestAnimationFrame(gameLoop);
}


gameLoop();
