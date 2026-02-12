export function checkCollision(game) {
  if (!game.bubble) return null;

  const maxDist2 = 2 * game.radius * (2 * game.radius);

  let closest = null;
  let bestD2 = Infinity;

  // collision avec une cellule occupée (Bubble / block / star)
  for (let row = 0; row < game.rows; row++) {
    for (let col = 0; col < game.cols; col++) {
      const cell = game.grid[row][col];
      if (!cell) continue;

      const dx = game.bubble.x - cell.x;
      const dy = game.bubble.y - cell.y;
      const d2 = dx * dx + dy * dy;

      if (d2 <= maxDist2 && d2 < bestD2) {
        bestD2 = d2;
        closest = { type: "cell", row, col };
      }
    }
  }

  if (closest) return closest;

  // plafond
  const topY = game.startY;
  if (game.bubble.y - game.radius <= topY - game.radius / 2) {
    return { type: "ceiling" };
  }

  return null;
}
