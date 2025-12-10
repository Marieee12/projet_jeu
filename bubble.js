export class Bubble {
  constructor(x, y, radius, color, vy = 0) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vy = vy; // vitesse verticale : négatif = vers le haut
    this.vx = 0;  // vitesse horizontale (ajoutée pour le tir en angle)
  }

  // Déplacement bulle
  update() {
    this.x += this.vx;          // déplacement horizontal
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
