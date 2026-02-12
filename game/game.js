import { Bubble } from "./bubble.js";
import { logInfo } from "../logger.js";
import { drawBackground, drawDangerLine, drawGrid } from "./renderer.js";
import {
  getNeighbors,
  getExistingColors,
} from "./gridLogic.js";
import { attachBubbleToGridFlow } from "./attachFlow.js";
import { initGridSpawn, spawnEntitiesOnGrid } from "./spawnLogic.js";
import { checkCollision as checkCollisionLogic } from "./collisionLogic.js";


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

    this.bubble = new Bubble(
      this.startX,
      this.shooterY,
      this.radius,
      this.currentColor
    );

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
    initGridSpawn(this, spawn);
  }

  // =========================
  // ENTITIES SPAWN
  // =========================
  spawnEntities(entities) {
    spawnEntitiesOnGrid(this, entities);
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

  getRandomColorFromExisting() {
    const palette = getExistingColors(
      this.grid,
      this.rows,
      this.cols,
      this.colors
    );
    return palette[Math.floor(Math.random() * palette.length)];
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

    if (this.bubble && this.bubble.vx === 0 && this.bubble.vy === 0) {
      this.bubble.x = this.startX;
    }
  }

  // =========================
  // DRAW
  // =========================
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
    return checkCollisionLogic(this);
  }

  // =========================
  // SNAP / ATTACH
  // =========================
  attachBubbleToGrid(collision) {
    return attachBubbleToGridFlow(this, collision);
  }

  checkGameOverLine() {
    const limitY = this.dangerLineY;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;

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
    if (this.isOver)
      return { removed: 0, fallen: 0, starBonus: 0 };

    let removed = 0;
    let fallen = 0;
    let starBonus = 0;

    if (this.bubble && (this.bubble.vx !== 0 || this.bubble.vy !== 0)) {
      this.bubble.update();

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
    if (!this.colors.includes(newColor)) return;
    if (this.bubble && (this.bubble.vx !== 0 || this.bubble.vy !== 0)) return;

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
















