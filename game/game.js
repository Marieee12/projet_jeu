import { Bubble } from "./bubble.js";

export class Game {
  constructor(canvas, ctx, levelConfig) {
    this.canvas = canvas;
    this.ctx = ctx;

    // =========================
    // CONFIG NIVEAU (JSON)
    // =========================
    this.level = levelConfig;

    // --- Paramètres bulles / grille ---
    this.radius = this.level.grid.radius;
    this.rows = this.level.grid.rows;
    this.cols = this.level.grid.cols;
    this.startY = this.level.grid.startY;

    this.colors = this.level.difficulty.availableColors;

    this.spacingX = this.radius * 2;
    this.spacingY = this.radius * Math.sqrt(3);

    // --- Difficulté ---
    this.turnsPerDrop = this.level.difficulty.turnsPerDrop;
    this.shotSpeed = this.level.difficulty.shotSpeed;

    // --- Zone canon ---
    this.shooterY = this.canvas.height - 60;
    this.startX = this.canvas.width / 2;

    // Ligne de défaite visible
    this.dangerLineY = this.shooterY - this.radius * 2;

    // --- État du jeu ---
    this.turnCount = 0;
    this.isOver = false;
    this.isWin = false;

    // =========================
    // GRILLE LOGIQUE
    // =========================
    this.grid = [];
    this.initGrid(this.level.spawn);

    // =========================
    // ENTITIES (blocks / stars)
    // =========================
    this.spawnEntities(this.level.entities || []);

    // On recale le canon selon la ligne la plus basse
    this.updateShooterPositionFromBottomRow();

    // =========================
    // FILE DE TIR : current + next
    // =========================
    this.currentColor = this.getRandomColorFromExisting();
    this.nextColor = this.getRandomColorFromExisting();

    this.bubble = new Bubble(this.startX, this.shooterY, this.radius, this.currentColor);
  }

  // =========================
  // INITIALISATION GRILLE (SPAWN)
  // =========================
  initGrid(spawn) {
    const filledRows = spawn.initialFilledRows;
    const pattern = spawn.pattern;
    const chance = spawn.randomFillChance ?? 1;

    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        if (row >= filledRows) {
          this.grid[row][col] = null;
          continue;
        }

        // Pattern : lignes pleines
        if (pattern === "rows_full") {
          // randomFillChance permet aussi de créer des "trous" si < 1
          if (Math.random() > chance) {
            this.grid[row][col] = null;
            continue;
          }

          const center = this.getCellCenter(row, col);
          const color = this.colors[col % this.colors.length];
          this.grid[row][col] = new Bubble(center.x, center.y, this.radius, color);
          continue;
        }

        // Pattern : aléatoire clairsemé
        if (pattern === "random_sparse") {
          if (Math.random() <= chance) {
            const center = this.getCellCenter(row, col);
            const color = this.colors[Math.floor(Math.random() * this.colors.length)];
            this.grid[row][col] = new Bubble(center.x, center.y, this.radius, color);
          } else {
            this.grid[row][col] = null;
          }
          continue;
        }

        // fallback : si pattern inconnu => comportement "rows_full"
        const center = this.getCellCenter(row, col);
        const color = this.colors[col % this.colors.length];
        this.grid[row][col] = new Bubble(center.x, center.y, this.radius, color);
      }
    }
  }

  // =========================
  // ENTITIES SPAWN
  // =========================
  spawnEntities(entities) {
    for (const e of entities) {
      const row = e.row;
      const col = e.col;
      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) continue;

      const center = this.getCellCenter(row, col);

      if (e.type === "block") {
        // bloc indestructible : occupe une case de la grille
        this.grid[row][col] = {
          type: "block",
          x: center.x,
          y: center.y,
          radius: this.radius,
          indestructible: true,
          shape: e.shape || "square",
        };
      }

      if (e.type === "star") {
        this.grid[row][col] = {
          type: "star",
          x: center.x,
          y: center.y,
          radius: this.radius,
          points: typeof e.points === "number" ? e.points : null,
        };
      }
    }
  }

  // =========================
  // HELPERS
  // =========================
  getCellCenter(row, col) {
    const offset = row % 2 === 1 ? this.radius : 0; // quinconce
    return {
      x: offset + this.radius + col * this.spacingX,
      y: this.startY + row * this.spacingY,
    };
  }

  getExistingColors() {
    const set = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        // ⚠️ uniquement les Bubble
        if (cell instanceof Bubble) set.add(cell.color);
      }
    }
    return set.size ? [...set] : this.colors;
  }

  getRandomColorFromExisting() {
    const palette = this.getExistingColors();
    return palette[Math.floor(Math.random() * palette.length)];
  }

 hasAnyBubble() {
  for (let r = 0; r < this.rows; r++) {
    for (let c = 0; c < this.cols; c++) {
      const cell = this.grid[r][c];
      // ✅ on ne compte que les vraies bulles
      if (cell instanceof Bubble) return true;
    }
  }
  return false;
}


  // =========================
  // POSITION CANON
  // =========================
  updateShooterPositionFromBottomRow() {
    let bottomRow = null;

    for (let r = this.rows - 1; r >= 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          bottomRow = r;
          break;
        }
      }
      if (bottomRow !== null) break;
    }

    const targetRow =
      bottomRow === null ? this.rows - 1 : Math.min(bottomRow + 1, this.rows - 1);

    const centerCanvasX = this.canvas.width / 2;

    let bestCol = 0;
    let bestDist = Infinity;

    for (let c = 0; c < this.cols; c++) {
      const center = this.getCellCenter(targetRow, c);
      const d = Math.abs(center.x - centerCanvasX);
      if (d < bestDist) {
        bestDist = d;
        bestCol = c;
      }
    }

    this.startX = this.getCellCenter(targetRow, bestCol).x;

    if (this.bubble && this.bubble.vx === 0 && this.bubble.vy === 0) {
      this.bubble.x = this.startX;
    }
  }

  // =========================
  // DRAW
  // =========================
  drawBackground() {
    const g = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    g.addColorStop(0, "#667eea");
    g.addColorStop(1, "#764ba2");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawDangerLine() {
    const y = this.dangerLineY;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.setLineDash([10, 8]);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = "rgba(255,255,255,0.65)";
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.font = "12px Montserrat, sans-serif";
    this.ctx.fillStyle = "rgba(255,255,255,0.75)";
    this.ctx.fillText("LIMITE", 12, y - 8);
    this.ctx.restore();
  }

  drawBlock(block) {
    const size = this.radius * 1.8;
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0,0,0,0.35)";
    this.ctx.strokeStyle = "rgba(255,255,255,0.7)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.rect(block.x - size / 2, block.y - size / 2, size, size);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawStar(star) {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(255,215,0,0.9)";
    this.ctx.strokeStyle = "rgba(255,255,255,0.8)";
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, this.radius * 0.85, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = "#111";
    this.ctx.font = "16px Montserrat, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText("★", star.x, star.y + 1);

    this.ctx.restore();
  }

  drawGrid() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;

        // Bubble classique
        if (cell instanceof Bubble) {
          cell.draw(this.ctx);
          continue;
        }

        // Block
        if (cell.type === "block") {
          this.drawBlock(cell);
          continue;
        }

        // Star
        if (cell.type === "star") {
          this.drawStar(cell);
          continue;
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawGrid();
    this.drawDangerLine();
    if (this.bubble) this.bubble.draw(this.ctx);
  }

  // =========================
  // NEIGHBORS (hex)
  // =========================
  getNeighbors(row, col) {
    const isOdd = row % 2 === 1;
    const deltas = isOdd
      ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
      : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

    const out = [];
    for (const [dr, dc] of deltas) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) out.push({ r, c });
    }
    return out;
  }

  // =========================
  // COLLISION
  // =========================
  checkCollision() {
    if (!this.bubble) return null;

    const maxDist2 = (2 * this.radius) * (2 * this.radius);

    let closest = null;
    let bestD2 = Infinity;

    // collision avec une cellule occupée (Bubble / block / star)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;

        const dx = this.bubble.x - cell.x;
        const dy = this.bubble.y - cell.y;
        const d2 = dx * dx + dy * dy;

        if (d2 <= maxDist2 && d2 < bestD2) {
          bestD2 = d2;
          closest = { type: "cell", row, col };
        }
      }
    }

    if (closest) return closest;

    // plafond
    const topY = this.startY;
    if (this.bubble.y - this.radius <= topY - this.radius / 2) {
      return { type: "ceiling" };
    }

    return null;
  }

  // =========================
  // MATCH / REMOVE
  // =========================
  findConnectedSameColor(startRow, startCol) {
    const start = this.grid[startRow][startCol];
    if (!(start instanceof Bubble)) return [];

    const color = start.color;
    const stack = [{ r: startRow, c: startCol }];
    const visited = new Set();
    const group = [];

    while (stack.length) {
      const { r, c } = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const b = this.grid[r][c];
      if (!(b instanceof Bubble)) continue;
      if (b.color !== color) continue;

      group.push({ r, c });

      for (const n of this.getNeighbors(r, c)) {
        const nb = this.grid[n.r][n.c];
        if (nb instanceof Bubble && nb.color === color) stack.push(n);
      }
    }

    return group;
  }

  removeCells(cells) {
    for (const { r, c } of cells) this.grid[r][c] = null;
  }

  // bulles connectées au plafond => restent, le reste tombe
  getConnectedToTop() {
    const stack = [];
    const visited = new Set();

    for (let c = 0; c < this.cols; c++) {
      if (this.grid[0][c]) stack.push({ r: 0, c });
    }

    while (stack.length) {
      const { r, c } = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      for (const n of this.getNeighbors(r, c)) {
        if (this.grid[n.r][n.c]) stack.push(n); // bubble OU entity
      }
    }

    return visited;
  }

  dropFloatingBubbles() {
    const connected = this.getConnectedToTop();
    const floating = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;

        const key = `${r},${c}`;
        if (connected.has(key)) continue;

        // ⚠️ on ne fait tomber QUE les Bubble, pas les blocks/stars
        if (cell instanceof Bubble) floating.push({ r, c });
      }
    }

    if (floating.length) this.removeCells(floating);
    return floating.length;
  }

  // =========================
  // SNAP / ATTACH
  // =========================
  attachBubbleToGrid(collision) {
    if (!this.bubble) return { removed: 0, fallen: 0, starBonus: 0 };

    const bx = this.bubble.x;
    const by = this.bubble.y;

    let bestRow = null;
    let bestCol = null;
    let bestD2 = Infinity;

    if (collision.type === "cell") {
      const { row, col } = collision;

      for (const { r, c } of this.getNeighbors(row, col)) {
        if (this.grid[r][c] !== null) continue;
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
    } else {
      // plafond => ligne 0
      const row = 0;
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[row][c] !== null) continue;
        const center = this.getCellCenter(row, c);
        const dx = bx - center.x;
        const dy = by - center.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestD2) {
          bestD2 = d2;
          bestRow = row;
          bestCol = c;
        }
      }
    }

    // fallback : plus proche case vide globale
    if (bestRow === null || bestCol === null) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] !== null) continue;
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
      }
    }

    if (bestRow === null || bestCol === null) {
      this.isOver = true; // grille pleine
      return { removed: 0, fallen: 0, starBonus: 0 };
    }

    // Bonus star : si la case ciblée contient une star (dans une logique future)
    // (normalement on ne vise que des cases vides, donc bonus star se gère plutôt via voisinage.
    // Ici : on garde le bonus "minimal" si un jour tu places une star sur une case vide spéciale.)
    let starBonus = 0;

    // align + place
    const center = this.getCellCenter(bestRow, bestCol);
    this.bubble.x = center.x;
    this.bubble.y = center.y;
    this.bubble.vx = 0;
    this.bubble.vy = 0;

    this.grid[bestRow][bestCol] = this.bubble;
    this.bubble = null;

    // match
    const group = this.findConnectedSameColor(bestRow, bestCol);
    let removed = 0;
    let fallen = 0;

    if (group.length >= 3) {
      removed = group.length;
      this.removeCells(group);
      fallen = this.dropFloatingBubbles();
    }

    // ⭐ Bonus si on "attrape" une star adjacente (simple)
    // Si tu veux : une star donne des points quand une bulle est posée à côté
    const neighbors = this.getNeighbors(bestRow, bestCol);
    for (const n of neighbors) {
      const cell = this.grid[n.r][n.c];
      if (cell && cell.type === "star") {
        const defaultPts = this.level?.scoring?.starBonusDefault ?? 500;
        starBonus += typeof cell.points === "number" ? cell.points : defaultPts;
        // on consomme la star
        this.grid[n.r][n.c] = null;
      }
    }

    // tir compté
    this.turnCount++;
    if (this.turnCount % this.turnsPerDrop === 0) {
      this.dropGridOneStep();
    }

    // win/lose
    if (!this.hasAnyBubble()) {
      this.isWin = true;
      this.isOver = true;
    } else if (this.checkGameOverLine()) {
      this.isOver = true;
    }

    // nouvelle bulle : next -> current, puis reroll next
    this.currentColor = this.nextColor;
    this.nextColor = this.getRandomColorFromExisting();

    this.updateShooterPositionFromBottomRow();
    this.bubble = new Bubble(this.startX, this.shooterY, this.radius, this.currentColor);

    return { removed, fallen, starBonus };
  }

  checkGameOverLine() {
    const limitY = this.dangerLineY;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;

        // si le bas de la cellule touche/passe la ligne -> perdu
        if (cell.y + cell.radius >= limitY) return true;
      }
    }
    return false;
  }

  // =========================
  // DROP GRID
  // =========================
  dropGridOneStep() {
    this.startY += this.spacingY;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        const center = this.getCellCenter(r, c);
        cell.x = center.x;
        cell.y = center.y;
      }
    }
  }

  // =========================
  // UPDATE
  // =========================
  update() {
    if (this.isOver) return { removed: 0, fallen: 0, starBonus: 0 };

    let removed = 0;
    let fallen = 0;
    let starBonus = 0;

    if (this.bubble && (this.bubble.vx !== 0 || this.bubble.vy !== 0)) {
      this.bubble.update();

      // rebonds murs
      if (this.bubble.x - this.radius <= 0) {
        this.bubble.x = this.radius;
        this.bubble.vx *= -1;
      } else if (this.bubble.x + this.radius >= this.canvas.width) {
        this.bubble.x = this.canvas.width - this.radius;
        this.bubble.vx *= -1;
      }

      const collision = this.checkCollision();
      if (collision) {
        const res = this.attachBubbleToGrid(collision);
        removed = res.removed;
        fallen = res.fallen;
        starBonus = res.starBonus;
      }

      // sécurité
      if (this.bubble && this.bubble.y + this.radius < 0) {
        this.resetBubble();
      }
    }

    return { removed, fallen, starBonus };
  }

  resetBubble() {
    this.updateShooterPositionFromBottomRow();

    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;
    this.bubble.vx = 0;
    this.bubble.vy = 0;

    // reset : current = next, puis reroll next
    this.currentColor = this.nextColor;
    this.nextColor = this.getRandomColorFromExisting();
    this.bubble.color = this.currentColor;
  }

  // =========================
  // SHOOT
  // =========================
  shoot(angle) {
    if (this.isOver) return;
    if (!this.bubble) return;
    if (this.bubble.vx !== 0 || this.bubble.vy !== 0) return;

    this.bubble.vx = Math.cos(angle) * this.shotSpeed;
    this.bubble.vy = Math.sin(angle) * this.shotSpeed;
  }
}













