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



// *************************************************************************** classe Game
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

    // Tableau pour stocker les bulles fixes en haut
    this.fixedBubbles = [];
    this.createFixedBubbles();

    // 🟢 AJOUT : recaler le départ de la bulle sur
    //            la bulle fixe la plus proche du centre

    const centerX = this.canvas.width / 2; // centre du canvas
    let closest = this.fixedBubbles[0];
    let minDist = Math.abs(closest.x - centerX);

    for (const fixed of this.fixedBubbles) {
      const dist = Math.abs(fixed.x - centerX);
      if (dist < minDist) {
        minDist = dist;
        closest = fixed;
      }
    }

    // maintenant "closest" = bulle fixe la plus proche du centre
    this.startX = closest.x;     // on change le X de départ officiel
    this.bubble.x = this.startX; // on recale aussi la bulle actuelle
  }

    createFixedBubbles() {
    const colors = ["#f97316", "#22c55e", "#3b82f6"]; // orange, vert, bleu
    const radius = 20;
    const spacing = radius * 2; // diamètre : les bulles se touchent
    const rows = 5;             // 👉 4 lignes fixes
    const startY = 80;          // hauteur de la première ligne

    // On calcule combien de bulles par ligne sur la largeur du canvas
    const cols = Math.floor(this.canvas.width / spacing);

    for (let row = 0; row < rows; row++) {
      const y = startY + row * spacing; // chaque ligne est une bulle plus bas

      for (let col = 0; col < cols; col++) {
        const x = radius + col * spacing; // centre des bulles sur l'axe X
        const color = colors[(row + col) % colors.length]; // alterne les couleurs
        this.fixedBubbles.push(new Bubble(x, y, radius, color, 0));
      }
    }
  }


  // Vérifie si la bulle tirée touche une bulle fixe
  checkCollisionWithFixedBubbles() {
    if (!this.bubble) return;

    for (const fixed of this.fixedBubbles) {
      const dx = this.bubble.x - fixed.x;
      const dy = this.bubble.y - fixed.y;
      const distanceSquared = dx * dx + dy * dy;
      const sumRadius = this.bubble.radius + fixed.radius;

      // si distance entre centres = somme des rayons -> collision
      if (distanceSquared <= sumRadius * sumRadius) {
        // Collision détectée

        // Aligne la bulle tirée sur la bulle fixe
        //    même x, et juste en dessous à une distance égale à la somme des rayons
        this.bubble.x = fixed.x;              // même centre horizontal
        this.bubble.y = fixed.y + sumRadius;  // centre juste en dessous

        // L'arreter 
        this.bubble.vy = 0;

        // 3) On garde une référence vers la bulle tirée qui vient de se fixer
          const newFixed = this.bubble;

          // 4) On "fixe" la bulle tirée en l'ajoutant aux bulles fixes
          this.fixedBubbles.push(newFixed);

          // 5) On cherche toutes les bulles connectées de même couleur
          const group = this.findConnectedSameColor(newFixed);

          // 6) Si on a au moins 3 bulles dans le groupe -> on les supprime
          if (group.length >= 3) {
            this.removeBubbles(group);
          }

        // Nouvvelle bulle en bas
        this.bubble = new Bubble(
          this.startX,
          this.startY,
          20,
          "#f97316",
          0  // immobile au départ
        );

        // Relancer le tir possible
        this.hasShot = false;

        // On arrete la boucle
        break;
      }
    }
  }

    // Trouve toutes les bulles fixes connectées à partir d'une bulle donnée
  // qui ont la même couleur (utilise une recherche en profondeur)
  findConnectedSameColor(startBubble) {
    const stack = [startBubble];
    const visited = new Set();
    const group = [];

    while (stack.length > 0) {
      const current = stack.pop();
      const key = current.x + "," + current.y;

      if (visited.has(key)) continue;
      visited.add(key);
      group.push(current);

      // On cherche les voisines de même couleur
      for (const other of this.fixedBubbles) {
        if (other === current) continue;
        if (other.color !== startBubble.color) continue;

        const dx = other.x - current.x;
        const dy = other.y - current.y;
        const distanceSquared = dx * dx + dy * dy;
        const sumRadius = current.radius + other.radius;

        // si les centres sont assez proches, on considère que les bulles sont connectées
        if (distanceSquared <= sumRadius * sumRadius + 0.1) {
          stack.push(other);
        }
      }
    }

    return group;
  }

  // Supprime de fixedBubbles toutes les bulles présentes dans "toRemove"
  removeBubbles(toRemove) {
    this.fixedBubbles = this.fixedBubbles.filter(
      (b) => !toRemove.includes(b)
    );
  }

  update() {
    //la bulle ne bouge que quand elle doit bouger
    if (this.bubble && this.bubble.vy !== 0) { // Vérifie que la bulle est en train de bouger
      this.bubble.update();

      // Si la bulle tirée touche une bulle fixe, gestion collision
      this.checkCollisionWithFixedBubbles();

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

    //  les bulles fixes
    for (const fixed of this.fixedBubbles) {
      fixed.draw(this.ctx);
    }

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
// ********************************************************************** Fin classe GAME


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



