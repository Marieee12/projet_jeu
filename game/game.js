import { Bubble } from "./bubble.js";
import { logInfo } from "../logger.js";

import { drawBackground, drawDangerLine, drawGrid } from "./renderer.js";
import {
  getNeighbors,
  getExistingColors,
  getConnectedToTop,
  hasAnyBubble,
  removeCells,
  findConnectedSameColor,
  dropFloatingBubbles,
} from "./gridLogic.js";

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

    // LOGS
    logInfo("game_init", {
      rows: this.rows,
      cols: this.cols,
      radius: this.radius,
      turnsPerDrop: this.turnsPerDrop,
      shotSpeed: this.shotSpeed,
      pattern: this.level?.spawn?.pattern,
    });
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
        // uniquement les Bubble
        if (cell instanceof Bubble) set.add(cell.color);
      }
    }
    return set.size ? [...set] : this.colors;
  }

  getRandomColorFromExisting() {
    const palette = getExistingColors(this.grid, this.rows, this.cols, this.colors);
    return palette[Math.floor(Math.random() * palette.length)];
  }

  hasAnyBubble() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        // on ne compte que les vraies bulles
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

  drawGrid() {
    drawGrid(this.ctx, this.grid, this.rows, this.cols, this.radius);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    drawBackground(this.ctx, this.canvas);
    drawGrid(this.ctx, this.grid, this.rows, this.cols, this.radius);
    drawDangerLine(this.ctx, this.canvas, this.dangerLineY);
    if (this.bubble) this.bubble.draw(this.ctx);
  }

  // =========================
  // NEIGHBORS 
  // =========================
  getNeighbors(row, col) {
    return getNeighbors(row, col, this.rows, this.cols);
  }

  // =========================
  // COLLISION
  // =========================
  checkCollision() {
    if (!this.bubble) return null;

    const maxDist2 = 2 * this.radius * (2 * this.radius);

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
    return findConnectedSameColor(this.grid, startRow, startCol, this.rows, this.cols);
  }

  removeCells(cells) {
    removeCells(this.grid, cells);
  }

  // bulles connectées au plafond => restent, le reste tombe
  getConnectedToTop() {
    return getConnectedToTop(this.grid, this.rows, this.cols);
  }

  dropFloatingBubbles() {
    return dropFloatingBubbles(this.grid, this.rows, this.cols);
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

    let starBonus = 0;
    let removed = 0;
    let fallen = 0;

    const dist2 = (x1, y1, x2, y2) => {
      const dx = x1 - x2;
      const dy = y1 - y2;
      return dx * dx + dy * dy;
    };

    const tryCells = (cells) => {
      for (const { r, c } of cells) {
        if (this.grid[r][c] !== null) continue;
        const center = this.getCellCenter(r, c);
        const d2 = dist2(bx, by, center.x, center.y);
        if (d2 < bestD2) {
          bestD2 = d2;
          bestRow = r;
          bestCol = c;
        }
      }
    };

    // 1) Trouver la meilleure case vide
    if (collision.type === "cell") {
      const { row, col } = collision;
      tryCells(this.getNeighbors(row, col));
    } else {
      // plafond => ligne 0
      const row = 0;
      const candidates = [];
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[row][c] === null) {
          candidates.push({ r: row, c });
        }
      }
      tryCells(candidates);
    }

    // fallback : plus proche case vide globale
    if (bestRow === null || bestCol === null) {
      const allEmpty = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] === null) {
            allEmpty.push({ r, c });
          }
        }
      }
      tryCells(allEmpty);
    }

    if (bestRow === null || bestCol === null) {
      this.isOver = true; // grille pleine
      return { removed: 0, fallen: 0, starBonus: 0 };
    }

    // 2) Placer la bulle sur la grille
    const center = this.getCellCenter(bestRow, bestCol);
    this.bubble.x = center.x;
    this.bubble.y = center.y;
    this.bubble.vx = 0;
    this.bubble.vy = 0;

    this.grid[bestRow][bestCol] = this.bubble;
    this.bubble = null;

    // 3) Match (>=3) => retire + drop floating (mécanique classique)
    const group = this.findConnectedSameColor(bestRow, bestCol);

    if (group.length >= 3) {
      removed = group.length;
      this.removeCells(group);

      // seulement après un match
      fallen += this.dropFloatingBubbles();
    }

    // 4) Star : si adjacent, consommer + détruire la bulle posée
    //  mais on ne déclenche PAS une chute globale ici
    let hitStar = false;

    const neighbors = this.getNeighbors(bestRow, bestCol);
    for (const n of neighbors) {
      const cell = this.grid[n.r][n.c];
      if (cell && cell.type === "star") {
        const defaultPts = this.level?.scoring?.starBonusDefault ?? 500;
        starBonus += typeof cell.points === "number" ? cell.points : defaultPts;
        this.grid[n.r][n.c] = null;
        hitStar = true;
      }
    }

    if (hitStar) {
      // la bulle tirée disparaît aussi
      if (this.grid[bestRow][bestCol]) {
        this.grid[bestRow][bestCol] = null;
        fallen += 1; // pour le score/feedback
      }
    }

    // 5) Tir compté + drop grille
    this.turnCount++;
    if (this.turnCount % this.turnsPerDrop === 0) {
      this.dropGridOneStep();
    }

    // 6) Win / Lose
    if (!hasAnyBubble(this.grid, this.rows, this.cols)) {
      this.isWin = true;
      this.isOver = true;
      logInfo("game_over", { outcome: "win", turnCount: this.turnCount });
    } else if (this.checkGameOverLine()) {
      this.isOver = true;
      logInfo("game_over", { outcome: "lose", reason: "danger_line", turnCount: this.turnCount });
    }

    // 7) Préparer la prochaine bulle
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

    // LOGS
    logInfo("shot_fired", {
      turnCount: this.turnCount,
      angle: Math.round(angle * 1000) / 1000,
      color: this.bubble.color,
    });
  }

  // =========================
  // CHANGER LA COULEUR DE LA BALLE ACTUELLE
  // =========================
  changeCurrentBallColor(newColor) {
    // Vérifier que la couleur existe dans les couleurs disponibles
    if (!this.colors.includes(newColor)) return;

    // Ne pas changer si la balle est en mouvement
    if (this.bubble && (this.bubble.vx !== 0 || this.bubble.vy !== 0)) return;

    // Changer la couleur de la balle actuelle
    this.currentColor = newColor;
    if (this.bubble) {
      this.bubble.color = newColor;
    }
  }

  // =========================
  // OBTENIR LES COULEURS ACTUELLES (pour l'UI)
  // =========================
  getCurrentColors() {
    return {
      current: this.currentColor,
      next: this.nextColor,
    };
  }
}















