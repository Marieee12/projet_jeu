export class Bubble {
  constructor(x, y, radius, color, vy = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vy = vy; // vitesse verticale : négatif = vers le haut
  }

  // Déplacement bulle
  update() {
    this.y += this.vy; // la bulle monte de 5 pixels par frame (-5)
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
