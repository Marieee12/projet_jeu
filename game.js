import { Bubble } from "./bubble.js";

export class Game {
  constructor(canvas, ctx, options = {}) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Options
    this.radius = options.radius || 16;
    this.colors =
      options.colors || ["#ff4d4d", "#4d94ff", "#4dff4d", "#ffff4d"];
    this.spacingX = this.radius * 2;            // écart horizontal = diamètre
    this.spacingY = this.radius * Math.sqrt(3); // écart vertical type hexagone

    // Grille logique
    this.rows = 14; // nombre total de lignes dans la grille
    this.cols = Math.floor((this.canvas.width - this.radius) / this.spacingX);
    this.startY = 60; // y de la première ligne

    // grid[row][col] = Bubble | null
    this.grid = [];
    this.initGrid(6); // lignes du haut remplies "comme au début"

    // Bulle tirée (position provisoire, on recale après)
    this.startX = this.canvas.width / 2;
    this.shooterY = this.canvas.height - 60;

    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      this.getRandomColorFromBottomRows(), // couleur de départ basée sur les lignes du bas
      0
    );

    // On recale la position initiale de la bulle en bas
    // en fonction de la grille (ligne la plus basse occupée)
    this.updateShooterPositionFromTopRow();

    this.hasShot = false;

    // Compteur de tours pour la descente progressive du plateau
    this.turnCount = 0;      // nombre de tirs effectués
    this.turnsPerDrop = 10;  // 🔽 le plateau descend tous les 10 tirs (augmente si tu veux encore plus de temps)
  }

  // Donne une couleur aléatoire parmi une liste
  getRandomColor(sourceColors) {
    const palette =
      sourceColors && sourceColors.length > 0 ? sourceColors : this.colors;
    const index = Math.floor(Math.random() * palette.length);
    return palette[index];
  }

  // Renvoie la liste des couleurs présentes dans les lignes du bas (par ex. les 3 dernières lignes occupées)
  getAvailableColorsFromBottomRows(maxDepth = 3) {
    // trouver la ligne occupée la plus basse
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

    if (bottomRow === null) {
      // plus aucune bulle -> aucune contrainte
      return [];
    }

    const minRow = Math.max(0, bottomRow - (maxDepth - 1));
    const set = new Set();

    for (let row = bottomRow; row >= minRow; row--) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          set.add(bubble.color);
        }
      }
    }

    return Array.from(set);
  }

  // utilitaire : couleur aléatoire basée sur les lignes du bas
  getRandomColorFromBottomRows() {
    const colors = this.getAvailableColorsFromBottomRows(3);
    return this.getRandomColor(colors);
  }

  // Initialise la grille : quelques lignes remplies, le reste vide
  // (pattern "comme au début" : lignes complètes en haut)
  initGrid(initialFilledRows) {
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        if (row < initialFilledRows) {
          // lignes du haut remplies
          const center = this.getCellCenter(row, col);
          const color = this.colors[col % this.colors.length];
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

    // 2) On choisit la ligne cible
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

    // 4) Positionner le départ sur le centre de cette colonne
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

  // Les voisins (6) d'une case (row, col)
  getNeighbors(row, col) {
    const neighbors = [];
    const isOdd = row % 2 === 1;

    // Grille
  
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
        ]; // Une ligne sur deux est décalée vers la droite.
// C’est ce décalage qui permet d’avoir 6 voisins par bulle (comme un hexagone)

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

  // Fait descendre tout le plateau d'une "ligne" vers le bas
  dropGridOneStep() {
    // On vérifie s'il reste au moins une bulle
    let hasBubble = false;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col]) {
          hasBubble = true;
          break;
        }
      }
      if (hasBubble) break;
    }
    if (!hasBubble) return; // plus rien à descendre

    // On descend le point de départ de la grille
    this.startY += this.spacingY;

    // On recalcule la position de toutes les bulles de la grille
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (!bubble) continue;

        const center = this.getCellCenter(row, col);
        bubble.x = center.x;
        bubble.y = center.y;
      }
    }
  }

  // Place la bulle dans la case de grille la plus proche autour
  // de la bulle touchée ou sur le plafond
  // on retourne le nombre de bulles supprimées
  attachBubbleToGrid(collision) {
    if (!this.bubble) return 0;

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
      return 0;
    }

    // 1) On récupère le centre de la case choisie
    const center = this.getCellCenter(bestRow, bestCol);

    // 2) On ALIGNE la bulle tirée exactement sur ce centre
    this.bubble.x = center.x;
    this.bubble.y = center.y;
    this.bubble.vy = 0;
    this.bubble.vx = 0;

    // 3) On la place dans la grille
    this.grid[bestRow][bestCol] = this.bubble;

    // 4) Puis on supprime la bulle tirée 
    this.bubble = null;

    // Match-3 à partir de cette case
    const group = this.findConnectedSameColor(bestRow, bestCol);
    let removed = 0;
    if (group.length >= 3) {
      removed = group.length;
      this.removeBubbles(group);
    }

    // On compte ce tir comme un tour joué
    this.turnCount++;

    //  Le plateau descend d'une ligne tous les X tirs
    if (this.turnCount % this.turnsPerDrop === 0) {
      this.dropGridOneStep();
    }

    // On recalcule la meilleure colonne de tir AVANT de créer la nouvelle bulle
    this.updateShooterPositionFromTopRow();

    // Nouvelle bulle en bas, déjà alignée sur la grille
    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      this.getRandomColorFromBottomRows(), // couleur basée sur les lignes du bas
      0
    );
    this.hasShot = false;

    return removed;
  }

  update() {
    let removed = 0;

    if (this.bubble && this.bubble.vy !== 0) {
      this.bubble.update();

      // Rebond sur les murs gauche/droite
      if (this.bubble.x - this.radius <= 0) {
        this.bubble.x = this.radius;
        this.bubble.vx *= -1;
      } else if (this.bubble.x + this.radius >= this.canvas.width) {
        this.bubble.x = this.canvas.width - this.radius;
        this.bubble.vx *= -1;
      }

      const collision = this.checkCollision();
      if (collision) {
        removed = this.attachBubbleToGrid(collision);
      }

      // Si elle sort du haut 
      if (this.bubble && this.bubble.y + this.bubble.radius < 0) {
        this.resetBubble();
      }
    }

    return removed; // important pour le score
  }

  resetBubble() {
    // on recalcule la meilleure colonne de tir selon la grille actuelle
    this.updateShooterPositionFromTopRow();

    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;
    this.bubble.vy = 0;
    this.bubble.vx = 0;

    // Nouvelle couleur basée sur les couleurs des lignes du bas
    this.bubble.color = this.getRandomColorFromBottomRows();

    this.hasShot = false;
  }

  drawBackground() {
    // fond violet 
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    gradient.addColorStop(0, "#667eea");
    gradient.addColorStop(1, "#764ba2");

    this.ctx.fillStyle = gradient;
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

  // Tir de la bulle
  // attendues: shoot(angle, color)
  shoot(angle, color) {
    if (!this.bubble) return;
    if (this.bubble.vy !== 0) return; // on ne tire que si elle est immobile

    const speed = 7; // vitesse de tir
    this.bubble.vx = Math.cos(angle) * speed;
    this.bubble.vy = Math.sin(angle) * speed; // négatif pour monter si angle = -PI/2
    this.hasShot = true;
  }
}







