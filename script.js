const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
class Bubble {
  constructor(x, y, radius, color) {
    this.x = x; // position
    this.y = y; // position
    this.radius = radius;
    this.color = color;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // cercle
    ctx.fillStyle = this.color;
    ctx.fill(); 

    // contour
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // centrée horizontalement, un peu vers le haut
    this.bubble = new Bubble(
      this.canvas.width / 2, // x : milieu du canvas
      this.canvas.height / 3, // y : un tiers de la hauteur
      20,                     // rayon
      "#f97316"           
    );
  }
  update() {
    // Plus tard : gestion des mouvements, collisions, etc.
  }

  // Background
  drawBackground() {
    this.ctx.fillStyle = "#020617"; // bleu nuit très foncé
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Frame
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.bubble.draw(this.ctx);
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
  start() {
    this.loop();
  }
}

const game = new Game(canvas, ctx);
game.start();

