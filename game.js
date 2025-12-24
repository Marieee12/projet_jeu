// game.js
import { Bubble } from "./bubble.js";

export class Game {
  constructor(canvas, ctx, options = {}) {
    this.canvas = canvas;
    this.ctx = ctx;

    // --- Options / paramètres ---
    this.radius = options.radius ?? 20;
    this.colors = options.colors ?? ["#ff4d4d", "#4d94ff", "#4dff4d", "#ffff4d"];

    // grille hex
    this.spacingX = this.radius * 2;
    this.spacingY = this.radius * Math.sqrt(3);

    this.rows = options.rows ?? 14;
    this.cols =
      options.cols ??
      Math.floor((this.canvas.width - this.radius) / this.spacingX);

    this.startY = options.startY ?? 60;

    // zone canon
    this.shooterY = options.shooterY ?? (this.canvas.height - 60);
    this.startX = this.canvas.width / 2;

    // ligne de défaite visible
    this.dangerLineY = this.shooterY - this.radius * 2;

    // descente
    this.turnCount = 0;
    this.turnsPerDrop = options.turnsPerDrop ?? 10;

    // état fin de partie
    this.isOver = false;
    this.isWin = false;

    // --- Grille ---
    this.grid = [];
    this.initGrid(options.initialFilledRows ?? 6);

    // place canon en fonction de la ligne la plus basse occupée
    this.updateShooterPositionFromBottomRow();

    // =========================
    // FILE D’ATTENTE : current + next
    // =========================
    this.nextColor = this.getRandomColorFromExisting();
    this.bubble = new Bubble(this.startX, this.shooterY, this.radius, this.nextColor);
    this.nextColor = this.getRandomColorFromExisting();
  }

  // =========================
  // INIT
  // =========================
  initGrid(initialFilledRows) {
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r < initialFilledRows) {
          const center = this.getCellCenter(r, c);
          const color = this.colors[c % this.colors.length];
          this.grid[r][c] = new Bubble(center.x, center.y, this.radius, color);
        } else {
          this.grid[r][c] = null;
        }
      }
    }
  }

  // =========================
  // HELPERS
  // =========================
  getCellCenter(row, col) {
    const offset = row % 2 === 1 ? this.radius : 0; // quinconce
    const x = offset + this.radius + col * this.spacingX;
    const y = this.startY + row * this.spacingY;
    return { x, y };
  }

  getRandomColor(sourceColors) {
    const palette = sourceColors?.length ? sourceColors : this.colors;
    return palette[Math.floor(Math.random() * palette.length)];
  }

  getExistingColors() {
    const set = new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const b = this.grid[r][c];
        if (b) set.add(b.color);
      }
    }
    return Array.from(set);
  }

  getRandomColorFromExisting() {
    const existing = this.getExistingColors();
    return this.getRandomColor(existing);
  }

  hasAnyBubble() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) if (this.grid[r][c]) return true;
    }
    return false;
  }

  // canon aligné sous la ligne la plus basse occupée
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
      bottomRow === null
        ? this.rows - 1
        : Math.min(bottomRow + 1, this.rows - 1);

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

    // recaler la bulle si immobile
    if (this.bubble && this.bubble.vx === 0 && this.bubble.vy === 0) {
      this.bubble.x = this.startX;
    }
  }

  // =========================
  // DRAW
  // =========================
  drawBackground() {
    const g = this.ctx.createLinearGradient(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    g.addColorStop(0, "#667eea");
    g.addColorStop(1, "#764ba2");
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const b = this.grid[r][c];
        if (b) b.draw(this.ctx);
      }
    }
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
      if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
        out.push({ r, c });
      }
    }
    return out;
  }

  // =========================
  // COLLISION
  // =========================
  checkCollision() {
    if (!this.bubble) return null;

    const r = this.radius;
    const maxDist2 = (2 * r) * (2 * r);

    let closest = null;
    let bestD2 = Infinity;

    // collision avec bulle fixe
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (!cell) continue;

        const dx = this.bubble.x - cell.x;
        const dy = this.bubble.y - cell.y;
        const d2 = dx * dx + dy * dy;

        if (d2 <= maxDist2 && d2 < bestD2) {
          bestD2 = d2;
          closest = { type: "bubble", row, col };
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
    if (!start) return [];

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
      if (!b || b.color !== color) continue;

      group.push({ r, c });

      for (const n of this.getNeighbors(r, c)) {
        const nb = this.grid[n.r][n.c];
        if (nb && nb.color === color) stack.push(n);
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
        if (this.grid[n.r][n.c]) stack.push(n);
      }
    }

    return visited;
  }

  dropFloatingBubbles() {
    const connected = this.getConnectedToTop();

    const floating = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r][c]) continue;
        const key = `${r},${c}`;
        if (!connected.has(key)) floating.push({ r, c });
      }
    }

    if (floating.length) this.removeCells(floating);
    return floating.length;
  }

  // =========================
  // SNAP / ATTACH
  // =========================
  attachBubbleToGrid(collision) {
    if (!this.bubble) return { removed: 0, fallen: 0 };

    const bx = this.bubble.x;
    const by = this.bubble.y;

    let bestRow = null;
    let bestCol = null;
    let bestD2 = Infinity;

    if (collision.type === "bubble") {
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

    // fallback : si aucune case libre autour => plus proche case vide globale
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
      return { removed: 0, fallen: 0 };
    }

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

    // nouvelle bulle : prend nextColor, puis on reroll nextColor
    this.updateShooterPositionFromBottomRow();
    this.bubble = new Bubble(this.startX, this.shooterY, this.radius, this.nextColor);
    this.nextColor = this.getRandomColorFromExisting();

    return { removed, fallen };
  }

  checkGameOverLine() {
    const limitY = this.dangerLineY;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const b = this.grid[r][c];
        if (!b) continue;

        // si le bas de la bulle touche/passe la ligne -> perdu
        if (b.y + b.radius >= limitY) return true;
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
        const b = this.grid[r][c];
        if (!b) continue;
        const center = this.getCellCenter(r, c);
        b.x = center.x;
        b.y = center.y;
      }
    }
  }

  // =========================
  // UPDATE
  // =========================
  update() {
    if (this.isOver) return { removed: 0, fallen: 0 };

    let removed = 0;
    let fallen = 0;

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
      }

      // sécurité
      if (this.bubble && this.bubble.y + this.radius < 0) {
        this.resetBubble();
      }
    }

    return { removed, fallen };
  }

  resetBubble() {
    this.updateShooterPositionFromBottomRow();
    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;
    this.bubble.vx = 0;
    this.bubble.vy = 0;

    // reset : prend la "next", puis reroll la suivante
    this.bubble.color = this.nextColor;
    this.nextColor = this.getRandomColorFromExisting();
  }

  // =========================
  // SHOOT (Option A : couleur imposée par le jeu)
  // =========================
  shoot(angle) {
    if (this.isOver) return;
    if (!this.bubble) return;
    if (this.bubble.vx !== 0 || this.bubble.vy !== 0) return;

    const speed = 9; // un peu plus rapide
    this.bubble.vx = Math.cos(angle) * speed;
    this.bubble.vy = Math.sin(angle) * speed;
  }
}











