import { Bubble } from "./bubble.js";

export class Game {
  constructor(canvas, ctx, options = {}) {
    this.canvas = canvas;
    this.ctx = ctx;

    // Options
    this.radius = options.radius || 20;
    this.colors = options.colors || ["#f97316", "#22c55e", "#3b82f6", "#facc15"];

    this.spacingX = this.radius * 2;            // écart horizontal = diamètre
    this.spacingY = this.radius * Math.sqrt(3); // écart vertical type hexagone

    // Grille logique
    this.rows = 10;
    this.cols = Math.floor((this.canvas.width - this.radius) / this.spacingX);
    this.startY = 80;

    this.grid = [];
    this.initGrid(7); // 7 premières lignes remplies

    // Position du "canon"
    this.shooterY = this.canvas.height - 60;
    this.startX = this.canvas.width / 2;

    // Bulle courante (celle qui part du bas)
    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      this.colors[0],
      0,
      0
    );

    // On recale en fonction de la grille
    this.updateShooterPositionFromTopRow();
  }

  // ----------------- INITIALISATION GRILLE -----------------
  initGrid(initialFilledRows) {
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        if (row < initialFilledRows) {
          const center = this.getCellCenter(row, col);
          const color = this.colors[col % this.colors.length];
          this.grid[row][col] = new Bubble(
            center.x,
            center.y,
            this.radius,
            color,
            0,
            0
          );
        } else {
          this.grid[row][col] = null;
        }
      }
    }
  }

  getCellCenter(row, col) {
    const offset = row % 2 === 1 ? this.radius : 0;
    const x = offset + this.radius + col * this.spacingX;
    const y = this.startY + row * this.spacingY;
    return { x, y };
  }

  // Recalcule la meilleure colonne pour tirer depuis le bas
  updateShooterPositionFromTopRow() {
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
      this.startX = this.canvas.width / 2;
      if (this.bubble && this.bubble.vx === 0 && this.bubble.vy === 0) {
        this.bubble.x = this.startX;
      }
      return;
    }

    const targetRow = Math.min(bottomRow + 1, this.rows - 1);
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

    const center = this.getCellCenter(targetRow, bestCol);
    this.startX = center.x;

    if (this.bubble && this.bubble.vx === 0 && this.bubble.vy === 0) {
      this.bubble.x = this.startX;
    }
  }

  // ----------------- COLLISIONS & MATCH-3 -----------------
  drawGrid() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const bubble = this.grid[row][col];
        if (bubble) bubble.draw(this.ctx);
      }
    }
  }

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

    if (closest) return closest;

    // 2) collision plafond
    const topY = this.startY;
    if (this.bubble.y - this.radius <= topY - this.radius / 2) {
      return { type: "ceiling" };
    }

    return null;
  }

  getNeighbors(row, col) {
    const neighbors = [];
    const isOdd = row % 2 === 1;

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

  findConnectedSameColor(startRow, startCol) {
    const startBubble = this.grid[startRow][startCol];
    if (!startBubble) return [];

    const color = startBubble.color;
    const stack = [{ r: startRow, c: startCol }];
    const visited = new Set();
    const group = [];

    while (stack.length > 0) {
      const { r, c } = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const bubble = this.grid[r][c];
      if (!bubble || bubble.color !== color) continue;

      group.push({ r, c });

      const neighbors = this.getNeighbors(r, c);
      for (const n of neighbors) {
        const nb = this.grid[n.r][n.c];
        if (!nb || nb.color !== color) continue;
        stack.push({ r: n.r, c: n.c });
      }
    }

    return group;
  }

  removeBubbles(group) {
    for (const { r, c } of group) {
      this.grid[r][c] = null;
    }
  }

  attachBubbleToGrid(collision) {
    if (!this.bubble) return 0;

    let bestRow = null;
    let bestCol = null;
    let bestD2 = Infinity;
    const bx = this.bubble.x;
    const by = this.bubble.y;

    if (collision.type === "bubble") {
      const { row, col } = collision;
      const neighbors = this.getNeighbors(row, col);

      for (const { r, c } of neighbors) {
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
    } else if (collision.type === "ceiling") {
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
      this.resetBubble();
      return 0;
    }

    const center = this.getCellCenter(bestRow, bestCol);
    this.bubble.x = center.x;
    this.bubble.y = center.y;
    this.bubble.vx = 0;
    this.bubble.vy = 0;

    this.grid[bestRow][bestCol] = this.bubble;
    this.bubble = null;

    const group = this.findConnectedSameColor(bestRow, bestCol);
    let removed = 0;
    if (group.length >= 3) {
      removed = group.length;
      this.removeBubbles(group);
    }

    this.updateShooterPositionFromTopRow();
    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      this.colors[0],
      0,
      0
    );

    return removed;
  }

  resetBubble() {
    this.updateShooterPositionFromTopRow();

    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;
    this.bubble.vx = 0;
    this.bubble.vy = 0;
  }

  // ----------------- UPDATE/DRAW -----------------
  update() {
    let removed = 0;

    if (this.bubble && (this.bubble.vx !== 0 || this.bubble.vy !== 0)) {
      this.bubble.update();

      // Rebonds murs
      if (this.bubble.x - this.radius <= 0 && this.bubble.vx < 0) {
        this.bubble.x = this.radius;
        this.bubble.vx *= -1;
      } else if (
        this.bubble.x + this.radius >= this.canvas.width &&
        this.bubble.vx > 0
      ) {
        this.bubble.x = this.canvas.width - this.radius;
        this.bubble.vx *= -1;
      }

      const collision = this.checkCollision();
      if (collision) {
        removed = this.attachBubbleToGrid(collision);
      }

      if (this.bubble && this.bubble.y + this.bubble.radius < 0) {
        this.resetBubble();
      }
    }

    return removed;
  }

  drawBackground() {
    this.ctx.fillStyle = "#020617";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawGrid();
    if (this.bubble) {
      this.bubble.draw(this.ctx);
    }
  }

  // ----------------- SHOOT -----------------
  shoot(angle, color) {
    if (!this.bubble) return;
    if (this.bubble.vx !== 0 || this.bubble.vy !== 0) return;

    const speed = 10;
    this.bubble.color = color;

    this.bubble.x = this.startX;
    this.bubble.y = this.shooterY;

    this.bubble.vx = Math.cos(angle) * speed;
    this.bubble.vy = Math.sin(angle) * speed;
  }
}
