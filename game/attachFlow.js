import { Bubble } from "./bubble.js";
import { logInfo } from "../logger.js";
import {
  getNeighbors,
  findConnectedSameColor,
  removeCells,
  dropFloatingBubbles,
  hasAnyBubble,
} from "./gridLogic.js";

function selectAttachCell(game, collision, bx, by) {
  let bestRow = null;
  let bestCol = null;
  let bestD2 = Infinity;

  const dist2 = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
  };

  const tryCells = (cells) => {
    for (const { r, c } of cells) {
      if (game.grid[r][c] !== null) continue;
      const center = game.getCellCenter(r, c);
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
    tryCells(getNeighbors(row, col, game.rows, game.cols));
  } else {
    // plafond => ligne 0
    const candidates = [];
    for (let c = 0; c < game.cols; c++) {
      if (game.grid[0][c] === null) candidates.push({ r: 0, c });
    }
    tryCells(candidates);
  }

  // fallback : plus proche case vide globale
  if (bestRow === null || bestCol === null) {
    const allEmpty = [];
    for (let r = 0; r < game.rows; r++) {
      for (let c = 0; c < game.cols; c++) {
        if (game.grid[r][c] === null) allEmpty.push({ r, c });
      }
    }
    tryCells(allEmpty);
  }

  if (bestRow === null || bestCol === null) return null;
  return { row: bestRow, col: bestCol };
}

function placeBubbleAtCell(game, row, col) {
  // 2) Placer la bulle sur la grille
  const center = game.getCellCenter(row, col);

  game.bubble.x = center.x;
  game.bubble.y = center.y;
  game.bubble.vx = 0;
  game.bubble.vy = 0;

  game.grid[row][col] = game.bubble;
  game.bubble = null;
}

function resolveMatchAndFloating(game, row, col) {
  // 3) Match (>=3) => retire + drop floating (mécanique classique)
  let removed = 0;
  let fallen = 0;

  const group = findConnectedSameColor(game.grid, row, col, game.rows, game.cols);

  if (group.length >= 3) {
    removed = group.length;
    removeCells(game.grid, group);

    // seulement après un match
    fallen += dropFloatingBubbles(game.grid, game.rows, game.cols);
  }

  return { removed, fallen };
}

function resolveStarsAround(game, row, col) {
  // 4) Star : si adjacent, consommer + détruire la bulle posée
  //  mais on ne déclenche PAS une chute globale ici
  let starBonus = 0;
  let fallen = 0;
  let hitStar = false;

  const neighbors = getNeighbors(row, col, game.rows, game.cols);
  for (const n of neighbors) {
    const cell = game.grid[n.r][n.c];
    if (cell && cell.type === "star") {
      const defaultPts = game.level?.scoring?.starBonusDefault ?? 500;
      starBonus += typeof cell.points === "number" ? cell.points : defaultPts;
      game.grid[n.r][n.c] = null;
      hitStar = true;
    }
  }

  if (hitStar) {
    // la bulle tirée disparaît aussi
    if (game.grid[row][col]) {
      game.grid[row][col] = null;
      fallen += 1; // pour le score/feedback
    }
  }

  return { starBonus, fallen };
}

function endTurnAndPrepareNextBubble(game) {
  // 5) Tir compté + drop grille
  game.turnCount++;
  if (game.turnCount % game.turnsPerDrop === 0) {
    game.dropGridOneStep();
  }

  // 6) Win / Lose
  if (!hasAnyBubble(game.grid, game.rows, game.cols)) {
    game.isWin = true;
    game.isOver = true;
    logInfo("game_over", { outcome: "win", turnCount: game.turnCount });
    return;
  }

  if (game.checkGameOverLine()) {
    game.isOver = true;
    logInfo("game_over", {
      outcome: "lose",
      reason: "danger_line",
      turnCount: game.turnCount,
    });
    return;
  }

  // 7) Préparer la prochaine bulle
  game.currentColor = game.nextColor;
  game.nextColor = game.getRandomColorFromExisting();

  game.updateShooterPositionFromBottomRow();
  game.bubble = new Bubble(game.startX, game.shooterY, game.radius, game.currentColor);
}

export function attachBubbleToGridFlow(game, collision) {
  if (!game.bubble) return { removed: 0, fallen: 0, starBonus: 0 };

  const bx = game.bubble.x;
  const by = game.bubble.y;

  const target = selectAttachCell(game, collision, bx, by);

  if (!target) {
    game.isOver = true; // grille pleine
    return { removed: 0, fallen: 0, starBonus: 0 };
  }

  const bestRow = target.row;
  const bestCol = target.col;

  placeBubbleAtCell(game, bestRow, bestCol);

  const matchRes = resolveMatchAndFloating(game, bestRow, bestCol);
  let removed = matchRes.removed;
  let fallen = matchRes.fallen;

  const starRes = resolveStarsAround(game, bestRow, bestCol);
  const starBonus = starRes.starBonus;
  fallen += starRes.fallen;

  endTurnAndPrepareNextBubble(game);

  return { removed, fallen, starBonus };
}