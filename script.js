const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// Bubble
class Bubble {
  constructor(x, y, radius, color, vy = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vy = vy; // vitesse verticale : négatif = vers le haut
  }

  // Déplaement bulle
  update() {
    this.y += this.vy; //la bulle monte de 5 pixels par frame (-5)
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}



// Game
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Position de la bulle au départ
    this.startX = this.canvas.width / 2; // au milieu
    this.startY = this.canvas.height - 60; // en bas

    // Une seule bulle "chargée" au centre en bas
    this.bubble = new Bubble(
      this.startX,
      this.startY,
      20,
      "#f97316",
      0 // immobile jusqu'au tir
    );

    this.hasShot = false; 
  }

  update() {
    //la bulle ne bouge QUE quand elle doit bouger
    if (this.bubble && this.bubble.vy !== 0) { // Vérifie que la bulle est en train de bouger.
      this.bubble.update();

      // Si elle sort du haut de l'écran : suppression pour l'instant
      if (this.bubble.y + this.bubble.radius < 0) {
        this.resetBubble();
      }
    }
  }

   resetBubble() {
    this.bubble.x = this.startX;
    this.bubble.y = this.startY;
    this.bubble.vy = 0;
  }

  drawBackground() {
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

    if (this.bubble) {
      this.bubble.draw(this.ctx);
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  start() {
    this.loop();
  }

  // Tir de la bulle
  shoot() {
    if (!this.bubble) return;

    // La bulle démarre vers le haut
    this.bubble.vy = -5;
    this.hasShot = true;
  }
}



// Lancer le jeu + contrôles
const game = new Game(canvas, ctx);
game.start();

canvas.addEventListener("click", () => {
  game.shoot();
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    game.shoot();
  }
});



