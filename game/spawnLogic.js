import { Bubble } from "./bubble.js";

export function initGridSpawn(game, spawn) {
  const filledRows = spawn.initialFilledRows;
  const pattern = spawn.pattern;
  const chance = spawn.randomFillChance ?? 1;

  for (let row = 0; row < game.rows; row++) {
    game.grid[row] = [];
    for (let col = 0; col < game.cols; col++) {
      if (row >= filledRows) {
        game.grid[row][col] = null;
        continue;
      }

      // Pattern : lignes pleines
      if (pattern === "rows_full") {
        // randomFillChance permet aussi de créer des "trous" si < 1
        if (Math.random() > chance) {
          game.grid[row][col] = null;
          continue;
        }

        const center = game.getCellCenter(row, col);
        const color = game.colors[col % game.colors.length];
        game.grid[row][col] = new Bubble(center.x, center.y, game.radius, color);
        continue;
      }

      // Pattern : aléatoire clairsemé
      if (pattern === "random_sparse") {
        if (Math.random() <= chance) {
          const center = game.getCellCenter(row, col);
          const color = game.colors[Math.floor(Math.random() * game.colors.length)];
          game.grid[row][col] = new Bubble(center.x, center.y, game.radius, color);
        } else {
          game.grid[row][col] = null;
        }
        continue;
      }

      // fallback : si pattern inconnu => comportement "rows_full"
      const center = game.getCellCenter(row, col);
      const color = game.colors[col % game.colors.length];
      game.grid[row][col] = new Bubble(center.x, center.y, game.radius, color);
    }
  }
}

export function spawnEntitiesOnGrid(game, entities) {
  for (const e of entities) {
    const row = e.row;
    const col = e.col;
    if (row < 0 || row >= game.rows || col < 0 || col >= game.cols) continue;

    const center = game.getCellCenter(row, col);

    if (e.type === "block") {
      // bloc indestructible : occupe une case de la grille
      game.grid[row][col] = {
        type: "block",
        x: center.x,
        y: center.y,
        radius: game.radius,
        indestructible: true,
        shape: e.shape || "square",
      };
    }

    if (e.type === "star") {
      game.grid[row][col] = {
        type: "star",
        x: center.x,
        y: center.y,
        radius: game.radius,
        points: typeof e.points === "number" ? e.points : null,
      };
    }
  }
}
