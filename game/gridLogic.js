import { Bubble } from "./bubble.js";

export function getNeighbors(row, col, rows, cols) {
  const isOdd = row % 2 === 1;
  const deltas = isOdd
    ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
    : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];

  const out = [];
  for (const [dr, dc] of deltas) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < rows && c >= 0 && c < cols) out.push({ r, c });
  }
  return out;
}

export function getExistingColors(grid, rows, cols, fallbackColors) {
  const set = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell instanceof Bubble) set.add(cell.color);
    }
  }
  return set.size ? [...set] : fallbackColors;
}

export function hasAnyBubble(grid, rows, cols) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] instanceof Bubble) return true;
    }
  }
  return false;
}

export function removeCells(grid, cells) {
  for (const { r, c } of cells) grid[r][c] = null;
}

export function findConnectedSameColor(grid, startRow, startCol, rows, cols) {
  const start = grid[startRow][startCol];
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

    const b = grid[r][c];
    if (!(b instanceof Bubble)) continue;
    if (b.color !== color) continue;

    group.push({ r, c });

    for (const n of getNeighbors(r, c, rows, cols)) {
      const nb = grid[n.r][n.c];
      if (nb instanceof Bubble && nb.color === color) stack.push(n);
    }
  }

  return group;
}

export function getConnectedToTop(grid, rows, cols) {
  const stack = [];
  const visited = new Set();

  for (let c = 0; c < cols; c++) {
    if (grid[0][c]) stack.push({ r: 0, c });
  }

  while (stack.length) {
    const { r, c } = stack.pop();
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    for (const n of getNeighbors(r, c, rows, cols)) {
      if (grid[n.r][n.c]) stack.push(n); // bubble OU entity
    }
  }

  return visited;
}

export function dropFloatingBubbles(grid, rows, cols) {
  const connected = getConnectedToTop(grid, rows, cols);
  const floating = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      const key = `${r},${c}`;
      if (connected.has(key)) continue;

      // on ne fait tomber QUE les Bubble
      if (cell instanceof Bubble) floating.push({ r, c });
    }
  }

  if (floating.length) removeCells(grid, floating);
  return floating.length;
}
