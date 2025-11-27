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


// *************************************************************************** classe Game
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Paramètres bulles
    this.radius = 20;
    this.spacingX = this.radius * 2;            // écart horizontal = diamètre
    this.spacingY = this.radius * Math.sqrt(3); // écart vertical type hexagone

    // Grille logique
    this.rows = 10; // nombre total de lignes dans la grille
    this.cols = Math.floor((this.canvas.width - this.radius) / this.spacingX);
    this.startY = 80; // y de la première ligne

    // grid[row][col] = Bubble | null
    this.grid = [];
    this.initGrid(7); // par ex : 5 premières lignes remplies

    // Bulle tirée (position provisoire, on recale après)
    this.startX = this.canvas.width / 2;
    this.shooterY = this.canvas.height - 60;

    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      "#f97316",
      0
    );

    // On recale la position initiale de la bulle en bas
    // en fonction de la grille (ligne la plus basse occupée)
    this.updateShooterPositionFromTopRow();

    this.hasShot = false;
  }

  // Initialise la grille : quelques lignes remplies, le reste vide
  initGrid(initialFilledRows) {
    const colors = ["#f97316", "#22c55e", "#3b82f6"]; // orange, vert, bleu

    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        if (row < initialFilledRows) {
          // lignes du haut remplies
          const center = this.getCellCenter(row, col);
          const color = colors[col % colors.length];
          this.grid[row][col] = new Bubble(
            center.x,
            center.y,
            this.radius,
            color,
            0
          );
        } else {
          // lignes du bas vides
          this.grid[row][col] = null;
        }
      }
    }
  }

  // Calcule le centre (x, y) d'une case de la grille (row, col)
  getCellCenter(row, col) {
    const offset = row % 2 === 1 ? this.radius : 0; // quinconce : 1 ligne sur 2 décalée
    const x = offset + this.radius + col * this.spacingX;
    const y = this.startY + row * this.spacingY;
    return { x, y };
  }

  // Recalcule la position de départ (startX) en fonction
  // de la ligne occupée la plus basse dans la grille
  updateShooterPositionFromTopRow() {
    // 1) Trouver la ligne occupée la plus basse
    let bottomRow = null;
    for (let row = this.rows - 1; row >= 0; row--) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          bottomRow = row;
          break;
        }
      }
      if (bottomRow !== null) break;
    }

    // S'il n'y a plus aucune bulle, on se met au centre
    if (bottomRow === null) {
      this.startX = this.canvas.width / 2;
      if (this.bubble && this.bubble.vy === 0) {
        this.bubble.x = this.startX;
      }
      return;
    }

    // 2) On choisit une "ligne cible" sous le cluster (logique de visée)
    const targetRow = Math.min(bottomRow + 1, this.rows - 1);

    // 3) Choisir la colonne dont le centre est le plus proche du centre de l'écran
    const centerCanvasX = this.canvas.width / 2;
    let bestCol = 0;
    let bestDist = Infinity;

    for (let col = 0; col < this.cols; col++) {
      const center = this.getCellCenter(targetRow, col);
      const d = Math.abs(center.x - centerCanvasX);
      if (d < bestDist) {
        bestDist = d;
        bestCol = col;
      }
    }

    // 4) Positionner le départ sur le centre de cette "colonne logique"
    const center = this.getCellCenter(targetRow, bestCol);
    this.startX = center.x;

    // Si la bulle actuelle est immobile, on la recale aussi
    if (this.bubble && this.bubble.vy === 0) {
      this.bubble.x = this.startX;
    }
  }


  // Dessine la grille de bulles fixes
  drawGrid() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          bubble.draw(this.ctx);
        }
      }
    }
  }

  // Cherche si la bulle tirée est suffisamment proche d'une bulle fixe ou du plafond
  // et renvoie des infos de collision
  checkCollision() {
    if (!this.bubble) return null;

    const r = this.radius;
    const maxDist = 2 * r;
    const maxDistSquared = maxDist * maxDist;

    let closest = null;
    let bestD2 = Infinity;

    // 1) collision avec une bulle fixe
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;

        const dx = this.bubble.x - cell.x;
        const dy = this.bubble.y - cell.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= maxDistSquared && d2 < bestD2) {
          bestD2 = d2;
          closest = { type: "bubble", row, col };
        }
      }
    }

    if (closest) {
      return closest;
    }

    // 2) collision avec le plafond (tout en haut)
    const topY = this.startY;
    if (this.bubble.y - this.radius <= topY - this.radius / 2) {
      return { type: "ceiling" };
    }

    return null;
  }

  // Place la bulle dans la case de grille la plus proche autour
  // de la bulle touchée ou sur le plafond
  attachBubbleToGrid(collision) {
    if (!this.bubble) return;

    let bestRow = null;
    let bestCol = null;
    let bestD2 = Infinity;

    const bx = this.bubble.x;
    const by = this.bubble.y;

    if (collision.type === "bubble") {
      const { row, col } = collision;

      // On regarde uniquement les voisins de cette bulle (6 cases potentielles)
      const neighbors = this.getNeighbors(row, col);
      for (const { r, c } of neighbors) {
        if (this.grid[r][c] !== null) continue; // case déjà occupée

        const center = this.getCellCenter(r, c);
        const dx = bx - center.x;
        const dy = by - center.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < bestD2) {
          bestD2 = d2;
          bestRow = r;
          bestCol = c;
        }
      }
    } else if (collision.type === "ceiling") {
      // Collision avec le plafond : on place sur la ligne 0
      const row = 0;
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col] !== null) continue;
        const center = this.getCellCenter(row, col);
        const dx = bx - center.x;
        const dy = by - center.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          bestRow = row;
          bestCol = col;
        }
      }
    }

    if (bestRow === null || bestCol === null) {
      // pas de case -> on reset
      this.resetBubble();
      return;
    }

    // 1) On récupère le centre de la case choisie
    const center = this.getCellCenter(bestRow, bestCol);

    // 2) On ALIGNE la bulle tirée exactement sur ce centre
    //    (ceci se produit avant le draw, donc l'utilisateur ne voit que
    //     la bulle déjà bien alignée, sans "saut" latéral).
    this.bubble.x = center.x;
    this.bubble.y = center.y;
    this.bubble.vy = 0;

    // 3) On la place dans la grille
    this.grid[bestRow][bestCol] = this.bubble;

    // 4) Puis on supprime la bulle tirée (elle ne sera plus dessinée séparément)
    this.bubble = null;

    // Match-3 à partir de cette case
    const group = this.findConnectedSameColor(bestRow, bestCol);
    if (group.length >= 3) {
      this.removeBubbles(group);
    }

    // On recalcule la meilleure colonne de tir AVANT de créer la nouvelle bulle
    this.updateShooterPositionFromTopRow();

    // Nouvelle bulle en bas, déjà alignée sur la grille
    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      "#f97316",
      0
    );
    this.hasShot = false;
  }


  // Vérifie si une case (row, col) a au moins un voisin occupé
  hasOccupiedNeighbor(row, col) {
    const neighbors = this.getNeighbors(row, col);
    for (const { r, c } of neighbors) {
      if (this.grid[r][c] !== null) return true;
    }
    return false;
  }

  // Les voisins "hexagonaux" (6) d'une case (row, col)
  getNeighbors(row, col) {
    const neighbors = [];
    const isOdd = row % 2 === 1;

    // offsets différents selon si la ligne est décalée ou non
    const deltas = isOdd
      ? [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ]
      : [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
        ];

    for (const [dr, dc] of deltas) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        neighbors.push({ r, c });
      }
    }

    return neighbors;
  }

  // DFS sur la grille à partir de (row, col) pour trouver les bulles
  // connectées de même couleur
  findConnectedSameColor(startRow, startCol) {
    const startBubble = this.grid[startRow][startCol];
    if (!startBubble) return [];

    const color = startBubble.color;
    const stack = [{ r: startRow, c: startCol }];
    const visited = new Set();
    const group = [];

    while (stack.length > 0) {
      const { r, c } = stack.pop();
      const key = r + "," + c;
      if (visited.has(key)) continue;
      visited.add(key);

      const bubble = this.grid[r][c];
      if (!bubble) continue;
      if (bubble.color !== color) continue;

      group.push({ r, c });

      const neighbors = this.getNeighbors(r, c);
      for (const n of neighbors) {
        const nb = this.grid[n.r][n.c];
        if (!nb) continue;
        if (nb.color !== color) continue;
        stack.push({ r: n.r, c: n.c });
      }
    }

    return group;
  }

  // Supprime les bulles du groupe (liste de {r, c})
  removeBubbles(group) {
    for (const { r, c } of group) {
      this.grid[r][c] = null;
    }
  }

  update() {
    if (this.bubble && this.bubble.vy !== 0) {
      this.bubble.update();

      const collision = this.checkCollision();
      if (collision) {
        this.attachBubbleToGrid(collision);
      }

      // Si elle sort du haut pour une raison quelconque
      if (this.bubble && this.bubble.y + this.bubble.radius < 0) {
        this.resetBubble();
      }
    }
  }

  resetBubble() {
    // on recalcule la meilleure colonne de tir selon la grille actuelle
    this.updateShooterPositionFromTopRow();

    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;
    this.bubble.vy = 0;
    this.hasShot = false;
  }


  drawBackground() {
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();

    // bulles fixes de la grille
    this.drawGrid();

    // bulle tirée
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
    if (this.bubble.vy !== 0) return; // on ne tire que si elle est immobile

    this.bubble.vy = -5; // vers le haut
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




